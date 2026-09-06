// Nastavení rozcestníku Arcade. Účty, odesílání her a Arcade Pass běží přes Supabase.
window.HUB_CONFIG = {
  supabaseUrl: "https://ofozkelnipwozpukbdfg.supabase.co",
  supabaseAnonKey: "sb_publishable_o8I4CvJRiM3IeXUI2V24cQ_wEUoYKt4",
  // Stripe: Payment Link pro měsíční Arcade Pass (bez reklam ve všech hrách). Do URL se přidá client_reference_id = id uživatele.
  stripePassLink: "",
  stripePublishableKey: "pk_test_51U7DkY2IsXtiAJVtSUgVU9WgFkXdFUFmcEmuwAfXTIHW0dTUvyX0J1JwjSbJUedfThhp2rmTucQtP2IegVXOaFlb00S08L1CxP",
  passPrice: "€3.99",
  kineUrl: "https://kine-lac.vercel.app",
};
