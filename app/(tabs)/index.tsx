import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function Home() {
  const router = useRouter();

  const [startText, setStartText] = useState('');
  const [endText, setEndText] = useState('');

  const [startSuggestions, setStartSuggestions] = useState<any[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<any[]>([]);

  const debounceRef = useRef<any>(null);

  /* =========================
     SAFE SEARCH (NO CRASHES)
  ========================= */
  const searchPlaces = async (text: string, setFn: any) => {
  if (text.length < 3) {
    setFn([]);
    return;
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(text)}`;

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'race-tracker-app'
      }
    });

    const textResponse = await res.text();

    // 🚨 CHECK IF IT'S HTML (BLOCKED / ERROR)
    if (textResponse.trim().startsWith('<')) {
      console.log("Blocked or HTML response from API");
      setFn([]);
      return;
    }

    const data = JSON.parse(textResponse);

    if (!Array.isArray(data)) {
      setFn([]);
      return;
    }

    setFn(data);

  } catch (err) {
    console.log("Search failed:", err);
    setFn([]);
  }
};

  const goPreview = () => {
    if (!startText || !endText) return;

    router.push({
      pathname: '/preview',
      params: {
        start: startText,
        end: endText
      }
    });
  };

  return (
    <View style={{
      flex:1,
      backgroundColor:'#050816',
      padding:20
    }}>

      <Text style={{
        color:'white',
        fontSize:34,
        fontWeight:'800',
        marginBottom:20
      }}>
        RaceTrckr
      </Text>

      {/* ================= START ================= */}
      <TextInput
        placeholder="Start location"
        placeholderTextColor="#94a3b8"
        value={startText}
        onChangeText={(t) => {
          setStartText(t);
          searchPlaces(t, setStartSuggestions);
        }}
        style={inputStyle}
      />

      {startSuggestions.length > 0 && (
        <View style={dropdown}>
          <FlatList
            data={startSuggestions}
            keyExtractor={(item) => item.place_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setStartText(item.display_name);
                  setStartSuggestions([]);
                }}
              >
                <Text style={suggestionText}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ================= END ================= */}
      <TextInput
        placeholder="End location"
        placeholderTextColor="#94a3b8"
        value={endText}
        onChangeText={(t) => {
          setEndText(t);
          searchPlaces(t, setEndSuggestions);
        }}
        style={inputStyle}
      />

      {endSuggestions.length > 0 && (
        <View style={dropdown}>
          <FlatList
            data={endSuggestions}
            keyExtractor={(item) => item.place_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => {
                  setEndText(item.display_name);
                  setEndSuggestions([]);
                }}
              >
                <Text style={suggestionText}>
                  {item.display_name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ================= BUTTON ================= */}
      <TouchableOpacity
        onPress={goPreview}
        style={button}
      >
        <Text style={{ textAlign:'center', fontWeight:'700' }}>
          Preview Route
        </Text>
      </TouchableOpacity>

    </View>
  );
}

/* ================= STYLES ================= */

const inputStyle = {
  backgroundColor:'#0f172a',
  padding:14,
  borderRadius:12,
  color:'white',
  marginBottom:10
};

const dropdown = {
  backgroundColor:'#020617',
  borderRadius:10,
  maxHeight:150,
  marginBottom:10,
  borderWidth:1,
  borderColor:'#1e293b'
};

const suggestionText = {
  color:'#e2e8f0',
  padding:12,
  borderBottomWidth:0.5,
  borderColor:'#1e293b'
};

const button = {
  marginTop:20,
  backgroundColor:'#38bdf8',
  padding:15,
  borderRadius:14
};