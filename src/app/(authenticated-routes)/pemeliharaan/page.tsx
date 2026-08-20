import { redirect } from "next/navigation";

// /pemeliharaan sebelumnya 404; dashboard adalah landing role ini.
export default function PemeliharaanIndexPage() {
	redirect("/pemeliharaan/dashboard");
}
