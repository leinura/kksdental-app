import { useEffect, useState } from "react";
import apiClient from "../api/client";

export function useCatalog() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [services, setServices] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [toothShades, setToothShades] = useState([]);
  const [priceList, setPriceList] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [servicesRes, warrantiesRes, shadesRes, priceRes] = await Promise.all([
        apiClient.get("/catalog/services"),
        apiClient.get("/catalog/warranties"),
        apiClient.get("/catalog/tooth-shades"),
        apiClient.get("/catalog/price-list"),
      ]);
      setServices(servicesRes.data);
      setWarranties(warrantiesRes.data);
      setToothShades(shadesRes.data);
      setPriceList(priceRes.data);
    } catch (err) {
      setError("Couldn't load form options. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, services, warranties, toothShades, priceList, reload: load };
}