import Trainer from "./Trainer";

export default async function CasePage({ params }: PageProps<"/cases/[id]">) {
  const { id } = await params;
  return <Trainer caseId={id} />;
}
