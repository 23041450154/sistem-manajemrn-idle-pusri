"use client";

import { useEffect, useState } from "react";
import {
	getEquipments,
	getFunctionalLocations,
	getObjectTypes,
	getPlants,
	getStorageLocations,
	searchSapEquipment,
} from "@/action/api";
import UsulanIdleClient from "./usulan-idle-client";

/* ponytail: legacy API payloads stay untyped until backend exports shared DTOs. */
/* eslint-disable @typescript-eslint/no-explicit-any */

export default function UsulanIdlePage() {
	const [objs, setObjs] = useState<any[]>([]);
	const [plantsList, setPlantsList] = useState<any[]>([]);
	const [storageLocList, setStorageLocList] = useState<any[]>([]);
	const [funcLocList, setFuncLocList] = useState<any[]>([]);
	const [initialEquipmentCodes, setInitialEquipmentCodes] = useState<any[]>([]);
	const [equipments, setEquipments] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		try {
			const [
				objectTypes,
				plants,
				storageLocations,
				funcLocs,
				allEquipments,
				sapInitial,
			] = await Promise.all([
				getObjectTypes().catch(() => []),
				getPlants().catch(() => []),
				getStorageLocations().catch(() => []),
				getFunctionalLocations().catch(() => []),
				getEquipments().catch(() => [] as any[]),
				searchSapEquipment(undefined, 20).catch(() => []),
			]);

			setObjs(objectTypes || []);
			setPlantsList(plants || []);
			setStorageLocList(storageLocations || []);
			setFuncLocList(funcLocs || []);
			setEquipments(allEquipments || []);
			setInitialEquipmentCodes(sapInitial || []);
		} catch (err) {
			console.error("Gagal memuat master data usulan idle:", err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		let alive = true;
		void (async () => {
			await loadData();
		})();
		return () => {
			alive = false;
		};
	}, []);

	if (loading) {
		return (
			<div className="p-8 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
				<div className="w-10 h-10 border-4 border-[#0A356A] border-t-transparent rounded-full animate-spin mb-4" />
				<p className="text-sm font-semibold text-gray-600">
					Memuat Formulir Pengusulan Alat Idle...
				</p>
			</div>
		);
	}

	return (
		<UsulanIdleClient
			objectTypes={objs}
			plants={plantsList}
			storageLocations={storageLocList}
			funcLocs={funcLocList}
			initialEquipmentCodes={initialEquipmentCodes}
			initialEquipments={equipments}
			onRefresh={loadData}
		/>
	);
}
