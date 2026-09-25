import DrillRunner from "./DrillRunner";

export default async function DrillPage({ params }: PageProps<"/favqulodda/[id]">) {
  const { id } = await params;
  return <DrillRunner drillId={id} />;
}
