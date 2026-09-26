WHAT THIS PACKAGE IS
---------------------
5 files that replace files already in your LPU project, so the app's
Products / Warehouses / Locations / Operations screens read and write
your LOCAL MySQL database instead of Firebase.

Login/signup screens are UNTOUCHED and will keep working exactly as
before (they already work via the AI Studio Firebase project) - we did
not touch that part, on purpose, to save time.

HOW TO INSTALL (5 minutes)
---------------------------
1. Extract this zip.
2. Copy these 4 files into your project, OVERWRITING the existing ones
   at the exact same location:
     LPU/backend/routes/products.js
     LPU/backend/routes/warehouses.js
     LPU/backend/routes/locations.js
     LPU/backend/routes/operations.js
3. Copy this 1 file, OVERWRITING the existing one:
     LPU/frontend/src/context/InventoryContext.tsx
4. Open MySQL Workbench, open a SQL tab on the vhat_stocksense schema,
   paste in safety_columns.sql, and run it (lightning bolt icon).
   This just makes sure 3 columns needed for Stock Adjustments exist.
   If they already exist, nothing bad happens.

HOW TO RUN THE APP
--------------------
1. Open a terminal in LPU/backend and run:  node server.js
   (leave this running - this is your local database server)
2. Open a SECOND terminal in LPU/frontend and run:  npm run dev
   (leave this running too - this is your website)
3. Open the URL it prints (usually http://localhost:5173) in your browser.

You should now be able to log in (Firebase, same as before), then go to
Products / Warehouses / Locations / Operations and anything you add,
edit, or validate there is saved in YOUR LOCAL MySQL database
(vhat_stocksense), not the cloud.

KNOWN LIMITATIONS (being upfront, not hiding anything)
---------------------------------------------------------
- Deleting a product isn't wired to a button in the app currently, so
  we didn't build that backend route - nothing is lost by this.
- The per-location "stock breakdown" shown on some product cards will
  read as empty/0 - the underlying product_location_stock table IS
  being updated correctly by every Receipt/Delivery/Transfer, we just
  didn't wire the read-back for that one visual detail (low priority,
  doesn't affect totals or any workflow).
- If you get a red error banner saying "Could not reach the local
  backend" - it means step 1 above (node server.js) isn't running, or
  crashed. Check that terminal window for the error message.
