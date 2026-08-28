import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import apiClient from "../../api/client";
import { colors, spacing, radius } from "../../theme/colors";

const TABS = ["Services", "Warranties", "Shades", "Pricing"];

export default function CatalogScreen() {
  const [activeTab, setActiveTab] = useState("Services");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [warranties, setWarranties] = useState([]);
  const [toothShades, setToothShades] = useState([]);
  const [priceList, setPriceList] = useState([]);

  const loadAll = useCallback(async () => {
    try {
      const [s, w, t, p] = await Promise.all([
        apiClient.get("/catalog/services"),
        apiClient.get("/catalog/warranties"),
        apiClient.get("/catalog/tooth-shades"),
        apiClient.get("/catalog/price-list"),
      ]);
      setServices(s.data);
      setWarranties(w.data);
      setToothShades(t.data);
      setPriceList(p.data);
    } catch (err) {
      Alert.alert("Couldn't load catalog", "Check your connection and try again.");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.dark} size="large" style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          {activeTab === "Services" && (
            <ServicesTab services={services} onChange={loadAll} refreshing={refreshing} onRefresh={handleRefresh} />
          )}
          {activeTab === "Warranties" && (
            <WarrantiesTab warranties={warranties} onChange={loadAll} refreshing={refreshing} onRefresh={handleRefresh} />
          )}
          {activeTab === "Shades" && (
            <ShadesTab shades={toothShades} onChange={loadAll} refreshing={refreshing} onRefresh={handleRefresh} />
          )}
          {activeTab === "Pricing" && (
            <PricingTab
              services={services}
              warranties={warranties}
              priceList={priceList}
              onChange={loadAll}
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          )}
        </>
      )}
    </View>
  );
}

// --- Services + nested Service Types + nested Sub-Types/Type-Warranties/Steps ---
function ServicesTab({ services, onChange, refreshing, onRefresh }) {
  const [newName, setNewName] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [newTypeName, setNewTypeName] = useState("");
  const [expandedTypeId, setExpandedTypeId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function addService() {
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post("/catalog/services", { name: newName.trim() });
      setNewName("");
      onChange();
    } catch (err) {
      Alert.alert("Couldn't add service", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function deleteService(service) {
    Alert.alert("Delete Service", `Delete "${service.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/catalog/services/${service.id}`);
            onChange();
          } catch (err) {
            Alert.alert("Couldn't delete", err.response?.data?.error || "Please try again.");
          }
        },
      },
    ]);
  }

  async function addServiceType(serviceId) {
    if (!newTypeName.trim()) return;
    try {
      await apiClient.post("/catalog/service-types", { name: newTypeName.trim(), serviceId });
      setNewTypeName("");
      onChange();
    } catch (err) {
      Alert.alert("Couldn't add service type", "Please try again.");
    }
  }

  function deleteServiceType(serviceType) {
    Alert.alert("Delete Service Type", `Delete "${serviceType.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/catalog/service-types/${serviceType.id}`);
            onChange();
          } catch (err) {
            Alert.alert("Couldn't delete", err.response?.data?.error || "Please try again.");
          }
        },
      },
    ]);
  }

  async function toggleUsesSteps(serviceType) {
    try {
      await apiClient.put(`/catalog/service-types/${serviceType.id}`, { usesSteps: !serviceType.usesSteps });
      onChange();
    } catch (err) {
      Alert.alert("Couldn't update", "Please try again.");
    }
  }

  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newName}
          onChangeText={setNewName}
          placeholder="New service name"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity style={styles.addButton} onPress={addService} disabled={submitting}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {services.length === 0 && <Text style={styles.emptyText}>No services yet - add one above.</Text>}

      {services.map((service) => {
        const expanded = expandedId === service.id;
        return (
          <View key={service.id} style={styles.card}>
            <TouchableOpacity style={styles.cardHeader} onPress={() => setExpandedId(expanded ? null : service.id)}>
              <Text style={styles.cardTitle}>{service.name}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Text style={styles.cardMeta}>{service.serviceTypes?.length || 0} types</Text>
                <TouchableOpacity onPress={() => deleteService(service)}>
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>

            {expanded && (
              <View style={styles.nestedSection}>
                {service.serviceTypes?.map((st) => {
                  const typeExpanded = expandedTypeId === st.id;
                  return (
                    <View key={st.id} style={styles.typeBlock}>
                      <TouchableOpacity
                        style={styles.nestedRow}
                        onPress={() => setExpandedTypeId(typeExpanded ? null : st.id)}
                      >
                        <Text style={styles.nestedText}>
                          {typeExpanded ? "▼" : "▶"} {st.name}
                        </Text>
                        <TouchableOpacity onPress={() => deleteServiceType(st)}>
                          <Text style={styles.deleteTextSmall}>×</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>

                      {typeExpanded && <ServiceTypeDetail serviceType={st} onChange={onChange} onToggleSteps={() => toggleUsesSteps(st)} />}
                    </View>
                  );
                })}
                <View style={styles.addRow}>
                  <TextInput
                    style={[styles.input, styles.inputSmall, { flex: 1 }]}
                    value={newTypeName}
                    onChangeText={setNewTypeName}
                    placeholder="New service type"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TouchableOpacity style={styles.addButtonSmall} onPress={() => addServiceType(service.id)}>
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

// Manages ONE Service Type's pricing configuration: either step-based
// (Complete Denture style) or Sub-Types + their own scoped Warranties
// (Crown > ALL CERAMIC / PFM / METAL style). Mutually exclusive - the
// usesSteps toggle switches which section is shown.
function ServiceTypeDetail({ serviceType, onChange, onToggleSteps }) {
  const [newSubtype, setNewSubtype] = useState("");
  const [newTypeWarranty, setNewTypeWarranty] = useState("");
  const [newStepName, setNewStepName] = useState("");
  const [newStepPrice, setNewStepPrice] = useState("");

  async function addSubtype() {
    if (!newSubtype.trim()) return;
    try {
      await apiClient.post("/catalog/service-subtypes", { name: newSubtype.trim(), serviceTypeId: serviceType.id });
      setNewSubtype("");
      onChange();
    } catch (err) {
      Alert.alert("Couldn't add sub-type", "Please try again.");
    }
  }

  function deleteSubtype(subtype) {
    Alert.alert("Delete Sub-Type", `Delete "${subtype.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/catalog/service-subtypes/${subtype.id}`);
            onChange();
          } catch (err) {
            Alert.alert("Couldn't delete", err.response?.data?.error || "Please try again.");
          }
        },
      },
    ]);
  }

  async function addTypeWarranty() {
    if (!newTypeWarranty.trim()) return;
    try {
      await apiClient.post("/catalog/service-type-warranties", {
        label: newTypeWarranty.trim(),
        serviceTypeId: serviceType.id,
      });
      setNewTypeWarranty("");
      onChange();
    } catch (err) {
      Alert.alert("Couldn't add warranty", "Please try again.");
    }
  }

  function deleteTypeWarranty(warranty) {
    Alert.alert("Delete Warranty", `Delete "${warranty.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/catalog/service-type-warranties/${warranty.id}`);
            onChange();
          } catch (err) {
            Alert.alert("Couldn't delete", err.response?.data?.error || "Please try again.");
          }
        },
      },
    ]);
  }

  async function addStep() {
    if (!newStepName.trim() || !newStepPrice) return;
    try {
      await apiClient.post("/catalog/service-steps", {
        name: newStepName.trim(),
        price: Number(newStepPrice),
        serviceTypeId: serviceType.id,
      });
      setNewStepName("");
      setNewStepPrice("");
      onChange();
    } catch (err) {
      Alert.alert("Couldn't add step", "Please try again.");
    }
  }

  function deleteStep(step) {
    Alert.alert("Delete Step", `Delete "${step.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/catalog/service-steps/${step.id}`);
            onChange();
          } catch (err) {
            Alert.alert("Couldn't delete", err.response?.data?.error || "Please try again.");
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.typeDetail}>
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Uses step-based pricing (e.g. Complete Denture)</Text>
        <Switch value={!!serviceType.usesSteps} onValueChange={onToggleSteps} />
      </View>

      {serviceType.usesSteps ? (
        <View>
          <Text style={styles.detailSectionLabel}>Steps</Text>
          {(serviceType.steps || []).length === 0 && (
            <Text style={styles.emptyTextSmall}>No steps yet - add one below.</Text>
          )}
          {(serviceType.steps || []).map((step) => (
            <View key={step.id} style={styles.detailRow}>
              <Text style={styles.detailRowText}>{step.name}</Text>
              <Text style={styles.detailRowPrice}>₹{Number(step.price).toFixed(2)}</Text>
              <TouchableOpacity onPress={() => deleteStep(step)}>
                <Text style={styles.deleteTextSmall}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, styles.inputSmall, { flex: 1 }]}
              value={newStepName}
              onChangeText={setNewStepName}
              placeholder="Step name (e.g. Special Tray)"
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.input, styles.inputSmall, { width: 90 }]}
              value={newStepPrice}
              onChangeText={setNewStepPrice}
              placeholder="Price"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.addButtonSmall} onPress={addStep}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View>
          <Text style={styles.detailSectionLabel}>Sub-Types</Text>
          <View style={styles.chipWrap}>
            {(serviceType.subtypes || []).map((sub) => (
              <View key={sub.id} style={styles.chip}>
                <Text style={styles.chipText}>{sub.name}</Text>
                <TouchableOpacity onPress={() => deleteSubtype(sub)}>
                  <Text style={styles.chipDelete}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {(serviceType.subtypes || []).length === 0 && (
              <Text style={styles.emptyTextSmall}>None yet - add one below.</Text>
            )}
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, styles.inputSmall, { flex: 1 }]}
              value={newSubtype}
              onChangeText={setNewSubtype}
              placeholder="e.g. Premium Zirconia"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.addButtonSmall} onPress={addSubtype}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.detailSectionLabel, { marginTop: spacing.md }]}>
            Warranty Options for this Service Type
          </Text>
          <View style={styles.chipWrap}>
            {(serviceType.typeWarranties || []).map((w) => (
              <View key={w.id} style={styles.chip}>
                <Text style={styles.chipText}>{w.label}</Text>
                <TouchableOpacity onPress={() => deleteTypeWarranty(w)}>
                  <Text style={styles.chipDelete}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {(serviceType.typeWarranties || []).length === 0 && (
              <Text style={styles.emptyTextSmall}>None - leave empty if this type has no warranty (e.g. METAL).</Text>
            )}
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={[styles.input, styles.inputSmall, { flex: 1 }]}
              value={newTypeWarranty}
              onChangeText={setNewTypeWarranty}
              placeholder="e.g. 10 Years"
              placeholderTextColor={colors.textMuted}
            />
            <TouchableOpacity style={styles.addButtonSmall} onPress={addTypeWarranty}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// --- Warranties (legacy/global list) ---
function WarrantiesTab({ warranties, onChange, refreshing, onRefresh }) {
  const [newLabel, setNewLabel] = useState("");

  async function add() {
    if (!newLabel.trim()) return;
    try {
      await apiClient.post("/catalog/warranties", { label: newLabel.trim() });
      setNewLabel("");
      onChange();
    } catch (err) {
      Alert.alert("Couldn't add warranty", "Please try again.");
    }
  }

  function remove(item) {
    Alert.alert("Delete Warranty", `Delete "${item.label}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/catalog/warranties/${item.id}`);
            onChange();
          } catch (err) {
            Alert.alert("Couldn't delete", err.response?.data?.error || "Please try again.");
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.helperText}>
        This is the original global warranty list, still used by any Service Type that hasn't been given its own
        Sub-Types (managed instead under Services).
      </Text>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newLabel}
          onChangeText={setNewLabel}
          placeholder="e.g. 1 Year"
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity style={styles.addButton} onPress={add}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {warranties.length === 0 && <Text style={styles.emptyText}>No warranties yet.</Text>}
      {warranties.map((w) => (
        <View key={w.id} style={styles.simpleRow}>
          <Text style={styles.cardTitle}>{w.label}</Text>
          <TouchableOpacity onPress={() => remove(w)}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// --- Tooth Shades ---
function ShadesTab({ shades, onChange, refreshing, onRefresh }) {
  const [newCode, setNewCode] = useState("");

  async function add() {
    if (!newCode.trim()) return;
    try {
      await apiClient.post("/catalog/tooth-shades", { code: newCode.trim() });
      setNewCode("");
      onChange();
    } catch (err) {
      Alert.alert("Couldn't add shade", err.response?.data?.error || "That code may already exist.");
    }
  }

  function remove(item) {
    Alert.alert("Delete Shade", `Delete "${item.code}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiClient.delete(`/catalog/tooth-shades/${item.id}`);
            onChange();
          } catch (err) {
            Alert.alert("Couldn't delete", err.response?.data?.error || "Please try again.");
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.addRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={newCode}
          onChangeText={setNewCode}
          placeholder="e.g. A3.5"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.addButton} onPress={add}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {shades.length === 0 && <Text style={styles.emptyText}>No shades yet.</Text>}
      <View style={styles.chipWrap}>
        {shades.map((s) => (
          <View key={s.id} style={styles.chip}>
            <Text style={styles.chipText}>{s.code}</Text>
            <TouchableOpacity onPress={() => remove(s)}>
              <Text style={styles.chipDelete}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// --- Pricing: legacy Service+ServiceType+Warranty, PLUS the new Sub-Type
// x Service-Type-Warranty pricing ---
function PricingTab({ services, warranties, priceList, onChange, refreshing, onRefresh }) {
  const [mode, setMode] = useState("legacy"); // "legacy" | "subtype"

  // --- legacy pricing form state ---
  const [serviceId, setServiceId] = useState(null);
  const [serviceTypeId, setServiceTypeId] = useState(null);
  const [warrantyId, setWarrantyId] = useState(null);
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // --- subtype pricing form state ---
  const [subServiceId, setSubServiceId] = useState(null);
  const [subServiceTypeId, setSubServiceTypeId] = useState(null);
  const [subtypeId, setSubtypeId] = useState(null);
  const [subTypeWarrantyId, setSubTypeWarrantyId] = useState(null);
  const [subPrice, setSubPrice] = useState("");
  const [subSubmitting, setSubSubmitting] = useState(false);

  const selectedService = services.find((s) => s.id === serviceId);
  const serviceTypes = selectedService?.serviceTypes || [];

  const subSelectedService = services.find((s) => s.id === subServiceId);
  const subServiceTypes = subSelectedService?.serviceTypes || [];
  const subSelectedType = subServiceTypes.find((t) => t.id === subServiceTypeId);
  const subtypeOptions = subSelectedType?.subtypes || [];
  const subTypeWarrantyOptions = subSelectedType?.typeWarranties || [];

  async function savePrice() {
    if (!serviceId || !serviceTypeId || !warrantyId || !price) {
      Alert.alert("Missing information", "Select Service, Service Type, Warranty, and enter a price.");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/catalog/price-list", {
        serviceId,
        serviceTypeId,
        warrantyId,
        price: Number(price),
      });
      setServiceId(null);
      setServiceTypeId(null);
      setWarrantyId(null);
      setPrice("");
      onChange();
    } catch (err) {
      Alert.alert("Couldn't save price", "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function removeEntry(entry) {
    Alert.alert(
      "Delete Price Entry",
      `Remove pricing for ${entry.service?.name} / ${entry.serviceType?.name} / ${entry.warranty?.label}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiClient.delete(`/catalog/price-list/${entry.id}`);
              onChange();
            } catch (err) {
              Alert.alert("Couldn't delete", "Please try again.");
            }
          },
        },
      ]
    );
  }

  async function saveSubtypePrice() {
    if (!subtypeId || !subPrice) {
      Alert.alert("Missing information", "Select a Sub-Type and enter a price (Warranty is optional).");
      return;
    }
    setSubSubmitting(true);
    try {
      await apiClient.post("/catalog/subtype-price-list", {
        serviceSubtypeId: subtypeId,
        serviceTypeWarrantyId: subTypeWarrantyId || undefined,
        price: Number(subPrice),
      });
      setSubtypeId(null);
      setSubTypeWarrantyId(null);
      setSubPrice("");
      onChange();
    } catch (err) {
      Alert.alert("Couldn't save price", err.response?.data?.error || "Please try again.");
    } finally {
      setSubSubmitting(false);
    }
  }

  async function removeSubtypePrice(entry) {
    try {
      await apiClient.delete(`/catalog/subtype-price-list/${entry.id}`);
      onChange();
    } catch (err) {
      Alert.alert("Couldn't delete", "Please try again.");
    }
  }

  return (
    <ScrollView style={styles.tabContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.tabRow}>
        {[
          { key: "legacy", label: "By Warranty" },
          { key: "subtype", label: "By Sub-Type" },
        ].map((m) => (
          <TouchableOpacity
            key={m.key}
            style={[styles.pill, mode === m.key && styles.pillActive]}
            onPress={() => setMode(m.key)}
          >
            <Text style={[styles.pillText, mode === m.key && styles.pillTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === "legacy" ? (
        <View>
          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Add / Update Price</Text>

          <Text style={styles.fieldLabel}>Service</Text>
          <View style={styles.pillRow}>
            {services.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.pill, serviceId === s.id && styles.pillActive]}
                onPress={() => {
                  setServiceId(s.id);
                  setServiceTypeId(null);
                }}
              >
                <Text style={[styles.pillText, serviceId === s.id && styles.pillTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedService && (
            <>
              <Text style={styles.fieldLabel}>Service Type</Text>
              <View style={styles.pillRow}>
                {serviceTypes.map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    style={[styles.pill, serviceTypeId === st.id && styles.pillActive]}
                    onPress={() => setServiceTypeId(st.id)}
                  >
                    <Text style={[styles.pillText, serviceTypeId === st.id && styles.pillTextActive]}>{st.name}</Text>
                  </TouchableOpacity>
                ))}
                {serviceTypes.length === 0 && (
                  <Text style={styles.emptyText}>Add a service type under Services first.</Text>
                )}
              </View>
            </>
          )}

          <Text style={styles.fieldLabel}>Warranty</Text>
          <View style={styles.pillRow}>
            {warranties.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={[styles.pill, warrantyId === w.id && styles.pillActive]}
                onPress={() => setWarrantyId(w.id)}
              >
                <Text style={[styles.pillText, warrantyId === w.id && styles.pillTextActive]}>{w.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Price (₹)</Text>
          <TextInput
            style={styles.input}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity style={styles.submitButton} onPress={savePrice} disabled={submitting}>
            {submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Save Price</Text>}
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Current Price List</Text>
          {priceList.length === 0 && <Text style={styles.emptyText}>No prices set yet.</Text>}
          {priceList.map((entry) => (
            <View key={entry.id} style={styles.priceRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{entry.service?.name}</Text>
                <Text style={styles.cardMeta}>
                  {entry.serviceType?.name} · {entry.warranty?.label}
                </Text>
              </View>
              <Text style={styles.priceValue}>₹{Number(entry.price).toFixed(2)}</Text>
              <TouchableOpacity onPress={() => removeEntry(entry)}>
                <Text style={styles.deleteTextSmall}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View>
          <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Add / Update Sub-Type Price</Text>
          <Text style={styles.helperText}>
            For Service Types with Sub-Types (e.g. Crown &gt; ALL CERAMIC &gt; Premium Zirconia). Warranty is
            optional - leave it unselected for Service Types with none (e.g. METAL).
          </Text>

          <Text style={styles.fieldLabel}>Service</Text>
          <View style={styles.pillRow}>
            {services.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.pill, subServiceId === s.id && styles.pillActive]}
                onPress={() => {
                  setSubServiceId(s.id);
                  setSubServiceTypeId(null);
                  setSubtypeId(null);
                  setSubTypeWarrantyId(null);
                }}
              >
                <Text style={[styles.pillText, subServiceId === s.id && styles.pillTextActive]}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {subSelectedService && (
            <>
              <Text style={styles.fieldLabel}>Service Type</Text>
              <View style={styles.pillRow}>
                {subServiceTypes.map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    style={[styles.pill, subServiceTypeId === st.id && styles.pillActive]}
                    onPress={() => {
                      setSubServiceTypeId(st.id);
                      setSubtypeId(null);
                      setSubTypeWarrantyId(null);
                    }}
                  >
                    <Text style={[styles.pillText, subServiceTypeId === st.id && styles.pillTextActive]}>
                      {st.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {subSelectedType && (
            <>
              <Text style={styles.fieldLabel}>Sub-Type</Text>
              <View style={styles.pillRow}>
                {subtypeOptions.map((sub) => (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.pill, subtypeId === sub.id && styles.pillActive]}
                    onPress={() => setSubtypeId(sub.id)}
                  >
                    <Text style={[styles.pillText, subtypeId === sub.id && styles.pillTextActive]}>{sub.name}</Text>
                  </TouchableOpacity>
                ))}
                {subtypeOptions.length === 0 && (
                  <Text style={styles.emptyText}>Add a Sub-Type under Services first.</Text>
                )}
              </View>

              {subTypeWarrantyOptions.length > 0 && (
                <>
                  <Text style={styles.fieldLabel}>Warranty (optional)</Text>
                  <View style={styles.pillRow}>
                    {subTypeWarrantyOptions.map((w) => (
                      <TouchableOpacity
                        key={w.id}
                        style={[styles.pill, subTypeWarrantyId === w.id && styles.pillActive]}
                        onPress={() => setSubTypeWarrantyId(subTypeWarrantyId === w.id ? null : w.id)}
                      >
                        <Text style={[styles.pillText, subTypeWarrantyId === w.id && styles.pillTextActive]}>
                          {w.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          )}

          <Text style={styles.fieldLabel}>Price (₹)</Text>
          <TextInput
            style={styles.input}
            value={subPrice}
            onChangeText={setSubPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity style={styles.submitButton} onPress={saveSubtypePrice} disabled={subSubmitting}>
            {subSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitText}>Save Price</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.sectionLabel, { marginTop: spacing.xl }]}>Current Sub-Type Prices</Text>
          {services.flatMap((s) =>
            (s.serviceTypes || []).flatMap((st) =>
              (st.subtypes || []).flatMap((sub) =>
                (sub.priceEntries || []).map((entry) => {
                  const warrantyLabel = st.typeWarranties?.find((w) => w.id === entry.serviceTypeWarrantyId)?.label;
                  return (
                    <View key={entry.id} style={styles.priceRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>
                          {s.name} · {st.name}
                        </Text>
                        <Text style={styles.cardMeta}>
                          {sub.name}
                          {warrantyLabel ? ` · ${warrantyLabel}` : ""}
                        </Text>
                      </View>
                      <Text style={styles.priceValue}>₹{Number(entry.price).toFixed(2)}</Text>
                      <TouchableOpacity onPress={() => removeSubtypePrice(entry)}>
                        <Text style={styles.deleteTextSmall}>×</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )
            )
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  tabRow: { flexDirection: "row", padding: spacing.sm, gap: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: radius.pill, alignItems: "center" },
  tabButtonActive: { backgroundColor: colors.dark },
  tabText: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  tabTextActive: { color: colors.white },
  tabContent: { flex: 1, padding: spacing.lg },
  helperText: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 17 },
  addRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md, alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  inputSmall: { paddingVertical: 8, fontSize: 13 },
  addButton: { backgroundColor: colors.dark, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 10 },
  addButtonSmall: { backgroundColor: colors.dark, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8 },
  addButtonText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  emptyText: { color: colors.textMuted, fontSize: 13, marginVertical: spacing.sm },
  emptyTextSmall: { color: colors.textMuted, fontSize: 12, marginBottom: spacing.sm },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, marginBottom: spacing.sm, overflow: "hidden" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md },
  cardTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  cardMeta: { fontSize: 12, color: colors.textMuted },
  deleteText: { color: colors.danger, fontSize: 12, fontWeight: "700" },
  deleteTextSmall: { color: colors.danger, fontSize: 18, fontWeight: "700", paddingHorizontal: 6 },
  nestedSection: { backgroundColor: colors.offWhite, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  typeBlock: { marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input, backgroundColor: colors.white },
  nestedRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, paddingHorizontal: spacing.sm },
  nestedText: { fontSize: 13, color: colors.text, fontWeight: "600" },
  typeDetail: { padding: spacing.sm, paddingTop: 0, borderTopWidth: 1, borderTopColor: colors.border },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm },
  switchLabel: { fontSize: 12, color: colors.text, flex: 1, marginRight: spacing.sm },
  detailSectionLabel: { fontSize: 12, fontWeight: "700", color: colors.text, marginBottom: spacing.xs },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailRowText: { flex: 1, fontSize: 13, color: colors.text },
  detailRowPrice: { fontSize: 13, fontWeight: "700", color: colors.text },
  simpleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.xs },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.offWhite,
    borderRadius: radius.pill,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: 6,
    gap: 4,
  },
  chipText: { fontSize: 13, fontWeight: "600", color: colors.text },
  chipDelete: { color: colors.danger, fontSize: 16, fontWeight: "700", paddingHorizontal: 4 },
  sectionLabel: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: colors.text, marginTop: spacing.sm, marginBottom: spacing.xs },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.xs },
  pill: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8 },
  pillActive: { backgroundColor: colors.dark, borderColor: colors.dark },
  pillText: { fontSize: 12, color: colors.text, fontWeight: "500" },
  pillTextActive: { color: colors.white },
  submitButton: { backgroundColor: colors.dark, borderRadius: radius.pill, paddingVertical: 14, alignItems: "center", marginTop: spacing.lg },
  submitText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  priceValue: { fontSize: 14, fontWeight: "700", color: colors.text },
});