import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { initialProfile } from "@/lib/initial-profile";
import { InitialModal } from "@/components/modals/initial-modal";

const SetupPage = async () => {
    const profile = await initialProfile();

    if (!profile) {
        return redirect("/sign-in");
    }

    // Bypass server requirement and go to the global Direct Messages UI.
    return redirect("/direct-messages");
}

export default SetupPage;

