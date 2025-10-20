"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button, Badge, Modal, Table, TableHeader, TableBody, TableRow, TableCell, SearchInput, SmartPagination } from "@/components/ui";
import { MapPin, Plus, CheckCircle, XCircle, AlertTriangle, Trash2 } from "lucide-react";
import {
  useCountries,
  useStates,
  useCitiesByState,
  useServiceableCities,
  useCreateServiceableCity,
  useUpdateServiceableCity,
  useDeleteServiceableCity,
  useGstCodeForState,
} from "@/hooks/useLocations";

type LocationMaster = {
  countryCode: string;
  country: string;
  states: { stateCode: string; state: string; cities: string[] }[];
};

type ServiceableCity = {
  id: string;
  country: string;
  state: string;
  city: string;
  status: "ACTIVE" | "PLANNING" | "PAUSED" | "LAUNCHING";
  launchDate?: string | null;
  priority?: number | null;
  isFeatured?: boolean | null;
};

// Removed static fallback: dropdowns should source exclusively from the database

export default function LocationsContent() {
  const normalizeLocationWording = (message: string): string => {
    if (!message) return message;
    return message
      // plural first to avoid double replacement
      .replace(/neighborhoods\b/gi, "localities")
      .replace(/\bNeighborhood\b/g, "Locality")
      .replace(/\bneighborhood\b/g, "locality");
  };

  const { data: countriesData } = useCountries();
  const [selectedCountry, setSelectedCountry] = useState<string>("IN");
  const [selectedState, setSelectedState] = useState<string>("");
  const { data: statesData } = useStates(selectedCountry);
  // Cities now load by GST state code derived from state name
  const { data: serviceableData, refetch: refetchServiceable } = useServiceableCities();
  const createCityMutation = useCreateServiceableCity();
  const updateCityMutation = useUpdateServiceableCity();
  const deleteCityMutation = useDeleteServiceableCity();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const countries = useMemo(() => countriesData ?? [], [countriesData]);
  const states = useMemo(() => statesData ?? [], [statesData]);
  const countryName = useMemo(() => countries.find((c) => c.code === selectedCountry)?.name || "", [countries, selectedCountry]);
  const stateName = useMemo(() => states.find((s) => s.code === selectedState)?.name || "", [states, selectedState]);
  const { data: gstStateCode } = useGstCodeForState(selectedCountry, stateName);
  const { data: citiesData } = useCitiesByState(selectedCountry, selectedState);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [countryQuery, setCountryQuery] = useState<string>("");
  const [stateQuery, setStateQuery] = useState<string>("");
  const [pagination, setPagination] = useState<{ currentPage: number; rowsPerPage: number }>({ currentPage: 1, rowsPerPage: 10 });

  const [serviceableCities, setServiceableCities] = useState<ServiceableCity[]>([]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAdd, setPendingAdd] = useState<{ country?: string; state?: string; city?: string } | null>(null);
  const [error, setError] = useState<string>("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ServiceableCity | null>(null);
  const [deleteError, setDeleteError] = useState<string>("");

  const cities = useMemo(() => (citiesData ? citiesData : []), [citiesData]);

  // Populate serviceable cities from backend
  useEffect(() => {
    if (serviceableData) {
      const mapped = serviceableData.map((c) => ({
        id: c.id,
        country: 'India',
        state: c.state,
        city: c.name,
        // Normalize backend lowercase enum to UI uppercase for display
        status: ((c.launch_status || 'planning').toUpperCase()) as ServiceableCity['status'],
        launchDate: null,
        priority: c.expansion_priority ?? null,
        isFeatured: null,
      }));
      setServiceableCities(mapped);
    }
  }, [serviceableData]);

  const handleAddClick = () => {
    setError("");
    if (!selectedCountry || !selectedState || !selectedCity) {
      setError("Please select country, state, and city.");
      return;
    }
    const duplicate = serviceableCities.some((sc) => sc.country === countryName && sc.state === stateName && sc.city === selectedCity);
    if (duplicate) {
      setError("City already added. Choose a different city or edit it below.");
      return;
    }
    setPendingAdd({ country: countryName, state: stateName, city: selectedCity });
    setShowConfirm(true);
  };

  const confirmAddCity = async () => {
    if (!pendingAdd) return;
    const gstCode = gstStateCode || "";
    try {
      await createCityMutation.mutateAsync({
        name: pendingAdd.city!,
        state: pendingAdd.state!,
        gst_state_code: gstCode,
        // Backend expects lowercase enum values
        launch_status: 'active',
      });
      setShowConfirm(false);
      setPendingAdd(null);
      setSelectedCity("");
      // Refresh list from backend
      await refetchServiceable();
    } catch (e: any) {
      setError(normalizeLocationWording(e?.message || 'Failed to add city'));
    }
  };

  const updateStatus = async (id: string, status: ServiceableCity["status"]) => {
    try {
      // Convert UI status to backend enum format (lowercase)
      await updateCityMutation.mutateAsync({ id, data: { launch_status: status.toLowerCase() as any } });
      setServiceableCities((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    } catch (e: any) {
      setError(normalizeLocationWording(e?.message || 'Failed to update status'));
    }
  };

  const handleDeleteClick = (city: ServiceableCity) => {
    setPendingDelete(city);
    setDeleteError("");
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCity = async () => {
    if (!pendingDelete) return;
    try {
      await deleteCityMutation.mutateAsync({ id: pendingDelete.id });
      setServiceableCities((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      setShowDeleteConfirm(false);
      setPendingDelete(null);
      setDeleteError("");
      // Refresh list from backend to ensure consistency
      await refetchServiceable();
    } catch (e: any) {
      const msg = e?.message || 'Failed to delete city';
      const friendly = normalizeLocationWording(msg);
      setError(friendly);
      setDeleteError(friendly);
    }
  };

  const filteredCities = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return serviceableCities;
    return serviceableCities.filter((c) =>
      [c.city, c.state, c.country, c.status].some((v) => (v || "").toString().toLowerCase().includes(q))
    );
  }, [serviceableCities, searchTerm]);

  const visibleCities = useMemo(() => {
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const end = start + pagination.rowsPerPage;
    return filteredCities.slice(start, end);
  }, [filteredCities, pagination]);

  useEffect(() => {
    // Reset to first page when search term changes or list updates
    setPagination((p) => ({ ...p, currentPage: 1 }));
  }, [searchTerm, selectedCountry, selectedState]);

  useEffect(() => {
    // Clear city selection when state changes
    setSelectedCity("");
  }, [selectedState]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Serviceable Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Country</label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-2">
                    <input
                      type="text"
                      value={countryQuery}
                      onChange={(e) => setCountryQuery(e.target.value)}
                      placeholder="Search country..."
                      className="w-full rounded-md border px-2 py-1 text-sm"
                    />
                  </div>
                  {countries
                    .filter((c) => c.name.toLowerCase().includes(countryQuery.trim().toLowerCase()))
                    .map((c) => (
                    <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">State</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-2">
                    <input
                      type="text"
                      value={stateQuery}
                      onChange={(e) => setStateQuery(e.target.value)}
                      placeholder="Search state..."
                      className="w-full rounded-md border px-2 py-1 text-sm"
                    />
                  </div>
                  {states
                    .filter((s) => s.name.toLowerCase().includes(stateQuery.trim().toLowerCase()))
                    .map((s) => (
                      <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem
                      key={city}
                      value={city}
                      disabled={serviceableCities.some((sc) => sc.state === stateName && sc.city.toLowerCase() === city.toLowerCase())}
                    >
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 justify-end md:justify-start">
              <Button variant="primary" onClick={handleAddClick} startIcon={<Plus className="w-4 h-4" />}>Add City</Button>
            </div>
          </div>
          {error && (
            <div className="mt-3 text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Active Serviceable Cities</CardTitle>
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search city, state, or country..."
              className="w-full sm:w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table className="min-w-full">
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-left text-sm dark:text-gray-400">City</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-left text-sm dark:text-gray-400">State</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-left text-sm dark:text-gray-400">Country</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-left text-sm dark:text-gray-400">Status</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-left text-sm dark:text-gray-400">Launch</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-center text-sm dark:text-gray-400 w-40">Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {visibleCities.map((c) => (
                <TableRow key={c.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                  <TableCell>{c.city}</TableCell>
                  <TableCell>{c.state}</TableCell>
                  <TableCell>{c.country}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === "ACTIVE" ? "success" : c.status === "PLANNING" ? "warning" : c.status === "PAUSED" ? "secondary" : "destructive"}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{c.launchDate || "—"}</TableCell>
                  <TableCell className="flex gap-2 justify-center">
                    <button
                      className="p-1.5 rounded-md text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
                      title="Activate"
                      onClick={() => updateStatus(c.id, "ACTIVE")}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-md text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      title="Pause"
                      onClick={() => updateStatus(c.id, "PAUSED")}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                      title="Delete"
                      onClick={() => handleDeleteClick(c)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4">
            <SmartPagination
              pagination={pagination}
              totalRecords={filteredCities.length}
              onPaginationChange={setPagination}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Confirm Add City</h3>
          <p className="text-sm text-gray-600">Add {pendingAdd?.city}, {pendingAdd?.state}, {pendingAdd?.country} as an active serviceable city?</p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmAddCity}>Confirm</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Confirm Delete City</h3>
          <p className="text-sm text-gray-600">Remove {pendingDelete?.city}, {pendingDelete?.state}, {pendingDelete?.country} from serviceable cities?</p>
          {deleteError && (
            <div className="mt-3 text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {deleteError}
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmDeleteCity}>Delete</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}