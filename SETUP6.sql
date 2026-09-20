-- ARCADE: rozšířený obchod (spusť po SETUP5.sql). Ceny musí sedět s rating.js (Meta.SHOP).
insert into public.shop_items (item, slot, price, pass_only) values
  ('ball_neon','ball',150,false),('ball_lava','ball',300,false),('ball_galaxy','ball',600,false),('ball_lime','ball',200,false),('ball_ice','ball',450,false),('ball_gold','ball',0,true),
  ('name_aqua','name',100,false),('name_coral','name',100,false),('name_lime','name',100,false),('name_violet','name',150,false),('name_gold','name',500,false),('name_fire','name',800,false),('name_ocean','name',800,false),('name_rainbow','name',0,true),
  ('trail_sparkle','trail',250,false),('trail_fire','trail',400,false),('trail_hearts','trail',400,false),('trail_stars','trail',700,false),
  ('badge_star','badge',200,false),('badge_bolt','badge',250,false),('badge_skull','badge',350,false),('badge_fire','badge',350,false),('badge_gamer','badge',500,false),('badge_crown','badge',800,false),('badge_diamond','badge',1500,false),('badge_pass','badge',0,true),
  ('title_rookie','title',50,false),('title_sweat','title',300,false),('title_night','title',300,false),('title_legend','title',2000,false),
  ('theme_ocean','theme',400,false),('theme_forest','theme',400,false),('theme_sunset','theme',600,false),('theme_mono','theme',600,false)
on conflict (item) do update set slot = excluded.slot, price = excluded.price, pass_only = excluded.pass_only;
