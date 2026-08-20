"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { projectInputSchema } from "@/lib/projects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function value(formData: FormData, name: string) {
  const entry = formData.get(name);
  return typeof entry === "string" ? entry : "";
}

export async function createProject(formData: FormData) {
  const parsed = projectInputSchema.safeParse({
    name: value(formData, "name"),
    description: value(formData, "description"),
    visibility: value(formData, "visibility"),
  });

  if (!parsed.success) {
    redirect("/projects/new?error=INVALID_INPUT");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...parsed.data, owner_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/projects/new?error=PROJECT_CREATION_FAILED");
  }

  revalidatePath("/dashboard");
  redirect(`/projects/${data.id}`);
}
