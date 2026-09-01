"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Pencil,
	Plus,
	Search,
	Trash2,
	UserRoundCog,
	Users,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
	createUser,
	deleteUser,
	getUsers,
	updateUser,
	type UserAccount,
} from "@/action/users";
import { ROLE_LABEL, ROLES, type Role } from "@/lib/roles";

const EMPTY_FORM = {
	name: "",
	email: "",
	npp: "",
	password: "",
	role: "UNIT_KERJA_OPERASI" as Role,
};
const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" });

export default function UserManagementPage() {
	const [users, setUsers] = useState<UserAccount[]>([]);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [search, setSearch] = useState("");
	const [role, setRole] = useState("ALL");
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<UserAccount | null>(null);
	const [form, setForm] = useState(EMPTY_FORM);
	const [deleting, setDeleting] = useState<UserAccount | null>(null);
	const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
		null,
	);

	async function load() {
		setLoading(true);
		const result = await getUsers();
		setUsers(result.data);
		if (!result.success)
			setNotice({ ok: false, text: result.message || "Gagal memuat pengguna." });
		setLoading(false);
	}

	useEffect(() => {
		// Fetch-on-mount: state berubah setelah Server Action selesai.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void load();
	}, []);

	const filtered = useMemo(() => {
		const query = search.trim().toLowerCase();
		return users.filter(
			(user) =>
				(role === "ALL" || user.role === role) &&
				(!query ||
					[user.name, user.email, user.npp].some((value) =>
						value.toLowerCase().includes(query),
					)),
		);
	}, [role, search, users]);

	function openCreate() {
		setEditing(null);
		setForm(EMPTY_FORM);
		setFormOpen(true);
	}

	function openEdit(user: UserAccount) {
		setEditing(user);
		setForm({
			name: user.name,
			email: user.email,
			npp: user.npp,
			password: "",
			role: user.role as Role,
		});
		setFormOpen(true);
	}

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setBusy(true);
		const result = editing
			? await updateUser(editing.id, form)
			: await createUser(form);
		setBusy(false);
		if (!result.success) {
			setNotice({
				ok: false,
				text: result.message || "Gagal menyimpan pengguna.",
			});
			return;
		}
		setFormOpen(false);
		setNotice({
			ok: true,
			text: editing ? "Pengguna diperbarui." : "Pengguna ditambahkan.",
		});
		await load();
	}

	async function confirmDelete() {
		if (!deleting) return;
		setBusy(true);
		const result = await deleteUser(deleting.id);
		setBusy(false);
		if (!result.success) {
			setNotice({
				ok: false,
				text: result.message || "Gagal menghapus pengguna.",
			});
			return;
		}
		setDeleting(null);
		setNotice({ ok: true, text: "Pengguna dihapus." });
		await load();
	}

	return (
		<main className="mx-auto max-w-[1400px] px-6 py-6">
			<header className="mb-5 flex flex-col gap-4 border-b border-[#E6E8EA] pb-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="mb-1 text-xs font-medium text-slate-500">
						Administrasi / Pengguna
					</p>
					<h1 className="text-xl font-semibold tracking-[-0.01em] text-slate-900">
						Pengaturan pengguna
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Kelola akun, NPP, dan hak akses pengguna aplikasi.
					</p>
				</div>
				<button
					onClick={openCreate}
					className="inline-flex min-h-11 items-center justify-center gap-2 rounded bg-[#0A356A] px-4 text-sm font-semibold text-white hover:bg-[#0556B3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-1"
				>
					<Plus className="h-4 w-4" /> Tambah pengguna
				</button>
			</header>

			{notice && (
				<div
					role="status"
					className={`mb-4 flex items-center justify-between rounded border px-4 py-3 text-sm ${notice.ok ? "border-emerald-600 text-emerald-700" : "border-red-600 text-red-700"}`}
				>
					<span>{notice.text}</span>
					<button
						aria-label="Tutup pemberitahuan"
						onClick={() => setNotice(null)}
						className="min-h-11 px-2 font-semibold"
					>
						×
					</button>
				</div>
			)}

			<section
				className="mb-4 grid gap-3 border border-[#E6E8EA] bg-white p-4 sm:grid-cols-[minmax(0,1fr)_240px]"
				aria-label="Filter pengguna"
			>
				<label className="relative">
					<span className="sr-only">Cari pengguna</span>
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
					<input
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Cari nama, email, atau NPP"
						className="min-h-11 w-full rounded border border-[#E6E8EA] bg-[#F8FAFC] pl-9 pr-3 text-sm outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-600/20"
					/>
				</label>
				<label>
					<span className="sr-only">Filter role</span>
					<select
						value={role}
						onChange={(event) => setRole(event.target.value)}
						className="min-h-11 w-full rounded border border-[#E6E8EA] bg-[#F8FAFC] px-3 text-sm outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-600/20"
					>
						<option value="ALL">Semua role</option>
						{ROLES.map((item) => (
							<option key={item} value={item}>
								{ROLE_LABEL[item]}
							</option>
						))}
					</select>
				</label>
			</section>

			<section
				className="overflow-hidden rounded border border-[#E6E8EA] bg-white"
				aria-label="Daftar pengguna"
			>
				{loading ? (
					<p className="p-10 text-center text-sm text-slate-500">
						Memuat data pengguna...
					</p>
				) : filtered.length === 0 ? (
					<div className="flex flex-col items-center p-10 text-center text-slate-500">
						<Users className="mb-3 h-7 w-7" />
						<p className="text-sm">Tidak ada pengguna yang sesuai.</p>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full border-collapse text-left text-[13px] tabular-nums">
							<thead className="sticky top-0 bg-[#F2F3F4] text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-600">
								<tr>
									<th className="px-4 py-2.5">Pengguna</th>
									<th className="px-4 py-2.5">NPP</th>
									<th className="px-4 py-2.5">Role</th>
									<th className="px-4 py-2.5">Dibuat</th>
									<th className="px-4 py-2.5 text-right">Aksi</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#E6E8EA]">
								{filtered.map((user) => (
									<tr key={user.id} className="hover:bg-[#F2F3F4]">
										<td className="px-4 py-2.5">
											<strong className="block font-semibold text-slate-900">
												{user.name}
											</strong>
											<span className="text-xs text-slate-500">{user.email}</span>
										</td>
										<td className="px-4 py-2.5 font-mono text-xs text-[#0A356A]">
											{user.npp}
										</td>
										<td className="px-4 py-2.5 text-slate-700">
											{ROLE_LABEL[user.role as Role] || user.role}
										</td>
										<td className="px-4 py-2.5 text-slate-500">
											{user.created_at ? date.format(new Date(user.created_at)) : "-"}
										</td>
										<td className="px-4 py-2.5">
											<div className="flex justify-end gap-1">
												<button
													aria-label={`Edit ${user.name}`}
													onClick={() => openEdit(user)}
													className="flex min-h-11 min-w-11 items-center justify-center rounded text-slate-600 hover:bg-slate-200 focus-visible:ring-2 focus-visible:ring-slate-600"
												>
													<Pencil className="h-4 w-4" />
												</button>
												<button
													aria-label={`Hapus ${user.name}`}
													onClick={() => setDeleting(user)}
													className="flex min-h-11 min-w-11 items-center justify-center rounded text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</section>

			{formOpen && (
				<div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
					<button
						aria-label="Tutup formulir"
						className="absolute inset-0 bg-slate-900/50"
						onClick={() => !busy && setFormOpen(false)}
					/>
					<form
						onSubmit={submit}
						role="dialog"
						aria-modal="true"
						aria-labelledby="user-form-title"
						className="relative w-full max-w-lg rounded border border-[#E6E8EA] bg-white shadow-2xl"
					>
						<div className="flex items-center gap-3 border-b border-[#E6E8EA] p-5">
							<UserRoundCog className="h-5 w-5 text-[#0A356A]" />
							<div>
								<h2
									id="user-form-title"
									className="text-sm font-semibold text-slate-900"
								>
									{editing ? "Edit pengguna" : "Tambah pengguna"}
								</h2>
								<p className="text-xs text-slate-500">
									{editing
										? "Perbarui identitas dan hak akses akun."
										: "Buat akun baru untuk pengguna aplikasi."}
								</p>
							</div>
						</div>
						<div className="grid gap-4 p-5 sm:grid-cols-2">
							<label className="text-xs font-medium text-slate-700">
								Nama
								<input
									required
									minLength={2}
									value={form.name}
									onChange={(event) => setForm({ ...form, name: event.target.value })}
									className="mt-1 min-h-11 w-full rounded border border-[#E6E8EA] px-3 text-sm outline-none focus:ring-2 focus:ring-slate-600/20"
								/>
							</label>
							<label className="text-xs font-medium text-slate-700">
								NPP
								<input
									required
									minLength={2}
									value={form.npp}
									onChange={(event) => setForm({ ...form, npp: event.target.value })}
									className="mt-1 min-h-11 w-full rounded border border-[#E6E8EA] px-3 text-sm outline-none focus:ring-2 focus:ring-slate-600/20"
								/>
							</label>
							<label className="text-xs font-medium text-slate-700 sm:col-span-2">
								Email
								<input
									required
									type="email"
									autoComplete="email"
									value={form.email}
									onChange={(event) => setForm({ ...form, email: event.target.value })}
									className="mt-1 min-h-11 w-full rounded border border-[#E6E8EA] px-3 text-sm outline-none focus:ring-2 focus:ring-slate-600/20"
								/>
							</label>
							<label className="text-xs font-medium text-slate-700 sm:col-span-2">
								Role
								<select
									required
									value={form.role}
									onChange={(event) =>
										setForm({ ...form, role: event.target.value as Role })
									}
									className="mt-1 min-h-11 w-full rounded border border-[#E6E8EA] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-slate-600/20"
								>
									{ROLES.map((item) => (
										<option key={item} value={item}>
											{ROLE_LABEL[item]}
										</option>
									))}
								</select>
							</label>
							{!editing && (
								<label className="text-xs font-medium text-slate-700 sm:col-span-2">
									Password
									<input
										required
										type="password"
										minLength={6}
										autoComplete="new-password"
										value={form.password}
										onChange={(event) =>
											setForm({ ...form, password: event.target.value })
										}
										className="mt-1 min-h-11 w-full rounded border border-[#E6E8EA] px-3 text-sm outline-none focus:ring-2 focus:ring-slate-600/20"
									/>
									<span className="mt-1 block text-xs font-normal text-slate-500">
										Minimal 6 karakter.
									</span>
								</label>
							)}
						</div>
						<div className="flex justify-end gap-3 border-t border-[#E6E8EA] bg-[#F8FAFC] p-4">
							<button
								type="button"
								disabled={busy}
								onClick={() => setFormOpen(false)}
								className="min-h-11 rounded border border-[#E6E8EA] bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-[#F2F3F4] disabled:opacity-50"
							>
								Batal
							</button>
							<button
								disabled={busy}
								className="min-h-11 rounded bg-[#0A356A] px-4 text-sm font-semibold text-white hover:bg-[#0556B3] disabled:opacity-50"
							>
								{busy ? "Menyimpan..." : "Simpan"}
							</button>
						</div>
					</form>
				</div>
			)}

			<ConfirmDialog
				open={Boolean(deleting)}
				onClose={() => !busy && setDeleting(null)}
				onConfirm={confirmDelete}
				title="Hapus pengguna?"
				description={`Akun ${deleting?.name || "ini"} tidak dapat digunakan lagi setelah dihapus.`}
				confirmLabel="Hapus"
				pendingLabel="Menghapus..."
				isPending={busy}
				tone="destructive"
			/>
		</main>
	);
}
