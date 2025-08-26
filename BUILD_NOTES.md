# Build Notes

After removing Stripe dependencies, you may need to:

1. Rebuild frontend to remove old Stripe references:
   ```bash
   cd frontend
   npm install  # Install dependencies without Stripe
   npm run build  # Rebuild without Stripe code
   ```

2. Deploy updated code to Render.com:
   ```bash
   git add .
   git commit -m "Remove Stripe, focus on PayU integration"
   git push origin main
   ```

The dist/ directory has been removed and will be regenerated without Stripe references.
