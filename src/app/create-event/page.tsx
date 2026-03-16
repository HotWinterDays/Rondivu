import { requirePermission } from "@/lib/auth";
import CreateEventForm from "./CreateEventForm";

export const dynamic = "force-dynamic";

export default async function CreateEventPage() {
  await requirePermission("createEvent", "/create-event");
  return <CreateEventForm />;
}
