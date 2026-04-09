import { createClient } from "@/lib/supabase-server";
import { supabase as supabaseService } from "@/lib/supabase";

const ADMIN_EMAIL = "konrad@ikonmedia.pl";
const HOSTINGER_HOST = "root@72.62.145.212";
const GITHUB_ORG = "ikonmediapl";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user?.email !== ADMIN_EMAIL) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error } = await supabaseService
    .from("projects")
    .select("id, workspace_path, workspace_repo_url, workspace_requested")
    .eq("id", id)
    .single();

  if (error || !project) {
    return Response.json({ error: "Projekt nie istnieje" }, { status: 404 });
  }

  // Already bootstrapped
  if (project.workspace_path) {
    const shortId = id.slice(0, 8);
    return Response.json({
      status: "ready",
      workspacePath: project.workspace_path,
      repoUrl: project.workspace_repo_url,
      sshCommand: `ssh ${HOSTINGER_HOST} 'tmux new -A -s p-${shortId} -c ${project.workspace_path} claude'`,
      tmuxAttach: `ssh ${HOSTINGER_HOST} 'tmux attach -t p-${shortId}'`,
    });
  }

  // Already requested, waiting for poller
  if (project.workspace_requested) {
    return Response.json({
      status: "provisioning",
      message: "Workspace jest przygotowywany. Odśwież za ~60 sekund.",
    });
  }

  // Request bootstrap via flag (poller on Hostinger picks it up)
  await supabaseService
    .from("projects")
    .update({ workspace_requested: true })
    .eq("id", id);

  return Response.json({
    status: "requested",
    message: "Workspace zakolejkowany. Będzie gotowy za ~1-2 minuty.",
    manualCommand: `ssh ${HOSTINGER_HOST} '~/bin/bootstrap-project.sh ${id}'`,
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user?.email !== ADMIN_EMAIL) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabaseService
    .from("projects")
    .select("id, workspace_path, workspace_repo_url, workspace_requested")
    .eq("id", id)
    .single();

  if (!project) {
    return Response.json({ error: "Projekt nie istnieje" }, { status: 404 });
  }

  const shortId = id.slice(0, 8);

  if (project.workspace_path) {
    return Response.json({
      status: "ready",
      workspacePath: project.workspace_path,
      repoUrl: project.workspace_repo_url,
      sshCommand: `ssh ${HOSTINGER_HOST} 'tmux new -A -s p-${shortId} -c ${project.workspace_path} claude'`,
      tmuxAttach: `ssh ${HOSTINGER_HOST} 'tmux attach -t p-${shortId}'`,
    });
  }

  if (project.workspace_requested) {
    return Response.json({
      status: "provisioning",
      message: "Workspace jest przygotowywany...",
    });
  }

  return Response.json({
    status: "none",
    message: "Workspace nie istnieje. Kliknij 'Otwórz w Claude Code' żeby go utworzyć.",
  });
}
