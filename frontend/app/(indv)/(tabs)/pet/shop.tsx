import { useEffect, useState } from "react"
import { View, Text, Button, FlatList, TouchableOpacity, Alert } from "react-native"
//import { api } from "@/lib/api"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "expo-router"

type Pet = { id: string; name: string; type: string; equipped?: string[] }
type Accessory = { id: string; name: string; slot: string; price: number; owned?: boolean }

export default function ShopScreen() {
  const { token } = useAuth()
  const router = useRouter()
  const [coins, setCoins] = useState(0)
  const [items, setItems] = useState<Accessory[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [selectedPet, setSelectedPet] = useState<string | null>(null)

  async function load() {
    const shop = await api("/accessories", { headers: { Authorization: `Bearer ${token}` } })
    const p: Pet[] = await api("/pets", { headers: { Authorization: `Bearer ${token}` } })
    setCoins(shop.coins)
    setItems(shop.items)
    setPets(p)
    if (!selectedPet && p.length > 0) setSelectedPet(p[0].id)
  }

  async function buy(id: string) {
    try {
      const r = await api(`/buy/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      Alert.alert("Purchased", `You bought ${id}. Coins left: ${r.coins}`)
      await load()
    } catch (e: any) {
      Alert.alert("Oops", e.message || "Could not buy")
    }
  }

  async function equip(accessoryId: string) {
    if (!selectedPet) return Alert.alert("Pick a pet first")
    try {
      await api(`/pets/${selectedPet}/equip`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ accessoryId }),
      })
      Alert.alert("Equipped", `Equipped ${accessoryId} to your pet!`)
    } catch (e: any) {
      Alert.alert("Oops", e.message || "Could not equip")
    }
  }

  useEffect(() => { load() }, [])

  return (
    <View style={{ padding: 16, gap: 12, flex: 1 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 20, fontWeight: "600" }}>Shop</Text>
        <Button title="My Pets" onPress={() => router.back()} />
      </View>

      <Text style={{ marginBottom: 6 }}>Coins: {coins}</Text>

      <Text style={{ fontWeight: "600", marginTop: 8 }}>Choose a pet to equip:</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {pets.map(p => (
          <TouchableOpacity
            key={p.id}
            onPress={() => setSelectedPet(p.id)}
            style={{
              borderWidth: 1, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10,
              backgroundColor: selectedPet === p.id ? "#def" : "white"
            }}>
            <Text>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <View style={{ borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: "600" }}>{item.name} — {item.slot}</Text>
            <Text style={{ color: "#666", marginVertical: 4 }}>{item.owned ? "Owned" : `Price: ${item.price}`}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {!item.owned ? (
                <Button title="Buy" onPress={() => buy(item.id)} />
              ) : (
                <Button title="Equip" onPress={() => equip(item.id)} />
              )}
            </View>
          </View>
        )}
      />
    </View>
  )
}
