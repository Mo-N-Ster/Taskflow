import { expect, test, type APIRequestContext } from "@playwright/test";

type MailpitAddress = {
  Address: string;
};

type MailpitMessage = {
  ID: string;
  To: MailpitAddress[];
};

type MailpitMessagesResponse = {
  messages: MailpitMessage[];
};

type MailpitMessageDetail = {
  HTML: string;
};

async function getConfirmationUrl(request: APIRequestContext, email: string) {
  let confirmationUrl: string | undefined;

  await expect.poll(async () => {
    const listResponse = await request.get("http://127.0.0.1:54324/api/v1/messages");
    if (!listResponse.ok()) {
      return false;
    }

    const { messages } = await listResponse.json() as MailpitMessagesResponse;
    const message = messages.find((entry) =>
      entry.To.some((recipient) => recipient.Address.toLowerCase() === email.toLowerCase()),
    );

    if (!message) {
      return false;
    }

    const detailResponse = await request.get(`http://127.0.0.1:54324/api/v1/message/${message.ID}`);
    if (!detailResponse.ok()) {
      return false;
    }

    const { HTML } = await detailResponse.json() as MailpitMessageDetail;
    const encodedLink = HTML.match(/href="([^"]*\/auth\/confirm[^"]*)"/)?.[1];
    if (!encodedLink) {
      return false;
    }

    confirmationUrl = encodedLink.replaceAll("&amp;", "&");
    return true;
  }, {
    message: `confirmation email for ${email}`,
    timeout: 10_000,
  }).toBe(true);

  if (!confirmationUrl) {
    throw new Error("Confirmation URL was not found");
  }

  return confirmationUrl;
}

test("user confirms their account and creates an isolated project", async ({ page, request, baseURL }) => {
  const uniqueId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const email = `playwright-${uniqueId}@example.com`;
  const password = "Synthetic-password-42!";
  const projectName = `Projet E2E ${uniqueId}`;

  await page.goto("/register");
  await page.getByLabel("Prénom").fill("E2E");
  await page.getByLabel("Nom", { exact: true }).fill("Synthetic");
  await page.getByLabel("Email professionnel").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password);
  await page.getByLabel("Confirmer", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  await expect(page).toHaveURL(/\/confirm-email\?email=/);
  await expect(page.getByRole("heading", { name: "Vérifiez votre email" })).toBeVisible();

  const confirmationUrl = new URL(await getConfirmationUrl(request, email));
  const applicationUrl = new URL(baseURL ?? "http://127.0.0.1:3100");
  confirmationUrl.protocol = applicationUrl.protocol;
  confirmationUrl.hostname = applicationUrl.hostname;
  confirmationUrl.port = applicationUrl.port;

  const confirmationResponse = await page.request.get(confirmationUrl.toString(), {
    maxRedirects: 0,
  });
  expect(confirmationResponse.status()).toBe(307);
  expect(new URL(confirmationResponse.headers().location, applicationUrl).pathname).toBe("/dashboard");
  expect((await page.context().cookies()).some((cookie) => cookie.name.startsWith("sb-"))).toBe(true);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("link", { name: "+ Nouveau projet" }).click();
  await page.getByLabel("Nom du projet").fill(projectName);
  await page.getByLabel("Description").fill("Projet synthétique créé par le test Playwright.");
  await page.getByLabel("Visibilité").selectOption("private");
  await page.getByRole("button", { name: "Créer le projet" }).click();

  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
  await expect(page.getByText("1", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "← Dashboard" }).click();
  await expect(page.getByRole("link", { name: projectName })).toBeVisible();

  await page.getByRole("button", { name: "Déconnexion" }).click();
  await expect(page).toHaveURL(/\/login\?status=SIGNED_OUT$/);
  await expect(page.getByRole("status")).toHaveText("Vous êtes maintenant déconnecté.");
  await expect.poll(async () =>
    (await page.context().cookies()).filter((cookie) => cookie.name.startsWith("sb-")).length,
  ).toBe(0);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?next=%2Fdashboard$/);

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("link", { name: projectName })).toBeVisible();
});

test("owner invites a member who accepts an assigned task and changes its status", async ({ page, request, baseURL }) => {
  test.setTimeout(90_000);
  const uniqueId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ownerEmail = `owner-${uniqueId}@example.com`;
  const memberEmail = `member-${uniqueId}@example.com`;
  const password = "Synthetic-password-42!";
  const projectName = `Collaboration ${uniqueId}`;
  const taskName = `Tâche assignée ${uniqueId}`;
  const applicationUrl = new URL(baseURL ?? "http://127.0.0.1:3100");

  async function registerAndConfirm(email: string, firstName: string) {
    await page.goto("/register");
    await page.getByLabel("Prénom").fill(firstName);
    await page.getByLabel("Nom", { exact: true }).fill("E2E");
    await page.getByLabel("Email professionnel").fill(email);
    await page.getByLabel("Mot de passe", { exact: true }).fill(password);
    await page.getByLabel("Confirmer", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    const confirmationUrl = new URL(await getConfirmationUrl(request, email));
    confirmationUrl.protocol = applicationUrl.protocol;
    confirmationUrl.hostname = applicationUrl.hostname;
    confirmationUrl.port = applicationUrl.port;
    const confirmationResponse = await page.request.get(confirmationUrl.toString(), { maxRedirects: 0 });
    expect(confirmationResponse.status()).toBe(307);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
  }

  await registerAndConfirm(ownerEmail, "Owner");
  await page.getByRole("link", { name: "+ Nouveau projet" }).click();
  await page.getByLabel("Nom du projet").fill(projectName);
  await page.getByRole("button", { name: "Créer le projet" }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}$/);
  const projectPath = new URL(page.url()).pathname;

  await page.getByLabel("Email du membre").fill(memberEmail);
  await page.getByLabel("Rôle").selectOption("member");
  await page.getByRole("button", { name: "Créer le lien d’invitation" }).click();
  const invitationText = await page.getByRole("status").textContent();
  const invitationPath = invitationText?.match(/\/invitations\/accept\?token=[a-f0-9]{64}/)?.[0];
  expect(invitationPath).toBeTruthy();

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await registerAndConfirm(memberEmail, "Member");
  await page.goto(invitationPath!);
  await page.getByRole("button", { name: "Accepter l’invitation" }).click();
  await expect(page.getByRole("status")).toContainText("Invitation acceptée");

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await page.getByLabel("Email").fill(ownerEmail);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto(projectPath);
  await page.getByLabel("Titre").fill(taskName);
  await page.getByLabel("Priorité").selectOption("high");
  await page.getByRole("checkbox", { name: "Member E2E" }).check();
  await page.getByRole("button", { name: "Créer la tâche" }).click();
  await expect(page.getByRole("heading", { name: taskName })).toBeVisible();

  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Déconnexion" }).click();
  await page.getByLabel("Email").fill(memberEmail);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: projectName }).click();
  await page.getByRole("link", { name: taskName }).click();
  await page.getByLabel("Nouveau statut").selectOption("done");
  await page.getByRole("button", { name: "Mettre à jour" }).click();
  await expect(page.getByRole("status")).toHaveText("Statut mis à jour.");
  await expect(page.getByRole("definition").filter({ hasText: "Terminée" })).toBeVisible();
});
