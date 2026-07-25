# 🍽️ Bhooky — AI-Powered Food Discovery & Ordering Assistant

## 🧠 Project Overview
Bhooky is an AI-powered food discovery and smart ordering assistant that allows users to search for food using natural language. It understands user intent (e.g., “something spicy under ₹300”) and returns relevant dishes, restaurants, and offers nearby.

Bhooky combines:
- Chat-based AI interaction
- Structured search & filtering
- Visual card-based UI
- Seamless redirection to Swiggy for checkout

---

## 🎯 Core Vision
> "From craving → to cart → to Swiggy in seconds"

Bhooky is not just a chatbot — it is a **food decision engine** powered by AI.

---

## 👥 Target Users
- Tech-savvy users
- Urban food delivery users
- People who struggle with decision fatigue in food apps

---

## ⚙️ Tech Stack
- Frontend: React + TypeScript + TailwindCSS
- Backend: Firebase (Firestore + Cloud Functions)
- AI: Gemini API
- Cloud: Google Cloud Platform (GCP)

---

## 🧩 System Architecture

### Flow:
User Input → AI (Gemini) → Structured Filters → Backend → Firestore → Ranking Engine → UI Cards → Cart → Swiggy Redirect

---

## 🤖 AI Layer (Gemini)

### Role:
- Understand natural language queries
- Convert them into structured JSON

### Example:
Input:
"Something spicy, veg, under ₹300, late night"

Output:
```json
{
  "food_type": "veg",
  "taste": "spicy",
  "budget": 300,
  "time": "late_night"
}
```

⚠️ AI does NOT fetch results — it only parses intent.

---

## 🗄️ Database Design (Firestore)

### 1. Restaurants
- id
- name
- location (GeoPoint)
- cuisines
- rating
- price_range
- is_open
- swiggy_id

### 2. Menu Items
- id
- restaurant_id
- name
- price
- veg (boolean)
- tags (spicy, healthy, fast, etc.)
- available

### 3. Offers
- id
- restaurant_id
- discount_type (percentage/flat)
- value
- min_order

---

## 🔍 Search & Ranking Engine (Core Logic)

### Pipeline:
AI → Filters → Firestore Query → Ranking → Results

### Ranking Factors:
- Budget match
- Distance
- Rating
- Offer strength
- Intent match

### Example Score Formula:
score =
  (budget_match * 0.3) +
  (distance * 0.2) +
  (rating * 0.2) +
  (offer * 0.2) +
  (intent_match * 0.1)

---

## 🧑‍💻 Backend (Firebase Functions)

### Functions:
1. parseIntent → Calls Gemini
2. searchFood → Queries Firestore
3. rankResults → Applies scoring
4. generateSwiggyLink → Creates redirect URL

---

## 🖥️ Frontend (React)

### Features:
- Chat interface (AI input)
- Search bar
- Filter chips
- Food cards (image, price, offer, restaurant)
- Cart (local state only)

---

## 🛒 Cart & Checkout

- Users add items to cart inside Bhooky
- On checkout → redirect to Swiggy
- Payment handled by Swiggy

---

## 🔗 Swiggy Integration

- Use deep linking (if available)
- Pass:
  - restaurant_id
  - item references

Fallback:
- Redirect to restaurant page

---

## 🚀 MVP Roadmap

### Phase 1:
- Static dataset
- Basic AI parsing
- Simple filters

### Phase 2:
- Ranking engine
- Offers integration
- UI improvements

### Phase 3:
- Location-based search
- Personalization

### Phase 4:
- Real-time integration with Swiggy
- Scaling

---

## ⚠️ Challenges

- Data accuracy (prices/offers)
- Deep linking limitations
- AI cost optimization
- Search quality

---

## 🔮 Future Scope

- Voice-based ordering
- Health-based recommendations
- AI meal planning
- Subscription food deals

---

## 🧠 Key Insight

Bhooky is not just an AI chatbot.

It is a:
👉 Structured food search engine  
👉 Powered by AI intent understanding  
👉 Optimized by ranking algorithms  

---

## 🏁 Summary

Bhooky simplifies food discovery by:
- Understanding how humans think
- Translating it into structured queries
- Delivering fast, relevant, and actionable results

