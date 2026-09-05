// Nastavení rozcestníku Arcade. Účty, odesílání her a Arcade Pass běží přes Supabase.
window.HUB_CONFIG = {
  supabaseUrl: "",         // stejný projekt jako hry
  supabaseAnonKey: "",
  // Stripe: Payment Link pro měsíční Arcade Pass (bez reklam ve všech hrách). Do URL se přidá client_reference_id = id uživatele.
  stripePassLink: "",
  stripePublishableKey: "pk_test_51U7DkY2IsXtiAJVtSUgVU9WgFkXdFUFmcEmuwAfXTIHW0dTUvyX0J1JwjSbJUedfThhp2rmTucQtP2IegVXOaFlb00S08L1CxP",
  passPrice: "€3.99",
  kineUrl: "https://kine-lac.vercel.app",
};
