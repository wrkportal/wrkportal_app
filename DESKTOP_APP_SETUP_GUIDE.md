# Desktop App Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `electron` - Desktop app framework
- `duckdb` - Columnar database for offline processing
- `electron-builder` - Build installers
- `electron-store` - Local storage

---

### 2. Run Desktop App (Development)

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
npm run electron:dev
```

**Expected:**
- Electron window opens
- Loads your Next.js app
- Works offline with local DuckDB

---

### 3. Build Desktop App (Production)

```bash
# Build Next.js
npm run build

# Build Electron installer
npm run electron:build
```

**Output:**
- Windows: `dist/Project Management Studio Setup.exe`
- Mac: `dist/Project Management Studio.dmg`
- Linux: `dist/Project Management Studio.AppImage`

---

## How It Works

### Desktop App Architecture

```
┌─────────────────────────────────┐
│      Electron Window              │
│  ┌───────────────────────────┐  │
│  │   Your Next.js App         │  │
│  │   (React Components)        │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Electron Main Process          │
│  ┌───────────────────────────┐  │
│  │   Local DuckDB             │  │
│  │   (Offline Database)       │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Offline Capabilities

**Works Offline:**
- ✅ Load Excel/CSV files
- ✅ Process data with DuckDB
- ✅ Create formulas (DataFlow)
- ✅ Build reports
- ✅ Save reports locally

**Needs Internet:**
- ⚠️ Publish reports to cloud
- ⚠️ Sync data
- ⚠️ User authentication (first time)

---

## Custom Formula Language: DataFlow

### Syntax Examples

**Basic Aggregations:**
```
TOTAL(amount)           → SUM(amount)
MEAN(price)            → AVG(price)
COUNT(id)              → COUNT(id)
MAXIMUM(price)         → MAX(price)
MINIMUM(price)         → MIN(price)
```

**Calculations:**
```
ADD(price, tax)                    → price + tax
SUBTRACT(revenue, cost)            → revenue - cost
MULTIPLY(quantity, price)          → quantity * price
DIVIDE(profit, revenue)            → (profit * 1.0) / NULLIF(revenue, 0)
PERCENT_OF(profit, revenue)       → (profit * 100.0) / NULLIF(revenue, 0)
GROWTH(current_sales, prev_sales) → ((current_sales - prev_sales) * 100.0) / NULLIF(prev_sales, 0)
```

**Conditional:**
```
IF_SUM(category = "A", amount)    → SUM(CASE WHEN category = 'A' THEN amount ELSE 0 END)
IF_MEAN(status = "active", price)  → AVG(CASE WHEN status = 'active' THEN price ELSE NULL END)
IF(amount > 1000, "High", "Low")  → CASE WHEN amount > 1000 THEN 'High' ELSE 'Low' END
```

**Time-based:**
```
PERIOD_TOTAL(amount, "year")       → SUM for current year
PERIOD_TOTAL(amount, "month")     → SUM for current month
PERIOD_TOTAL(amount, "quarter")   → SUM for current quarter
```

**Text:**
```
CONCAT(first_name, " ", last_name) → first_name || ' ' || last_name
UPPER(name)                        → UPPER(name)
LOWER(email)                       → LOWER(email)
```

---

## Integration with Your Current System

### Replace Current Formula Evaluator

**Current (in `database/page.tsx`):**
```typescript
const evaluateFormula = (formula: string, row: any[], columns: string[]) => {
  // Regex-based evaluation (slow, client-side)
}
```

**New (with DataFlow):**
```typescript
import { queryBuilder } from '@/lib/query-builder'

// For aggregate formulas
const result = await queryBuilder.executeFormula({
  table: 'imported_data',
  formula: 'TOTAL(amount)',
  groupBy: ['category']
})

// For per-row formulas
const result = await queryBuilder.executeFormula({
  table: 'imported_data',
  formula: 'ADD(price, tax)'
})
```

---

### Add Formula Builder UI

**In your calculated field dialog:**

```typescript
import { FormulaBuilder } from '@/components/formula-builder'

<Dialog>
  <DialogContent>
    <FormulaBuilder
      columns={tableData.columns}
      onFormulaChange={(formula, sql, isValid) => {
        if (isValid) {
          setNewFieldFormula(formula)
        }
      }}
      initialFormula={newFieldFormula}
      showSQL={true}
    />
  </DialogContent>
</Dialog>
```

---

## File Structure

```
Your Project/
├── electron/                    # NEW
│   ├── main.js                 # Electron main process
│   └── preload.js              # IPC bridge
├── lib/
│   ├── desktop-api.ts          # NEW - Unified API
│   ├── formula-parser.ts       # NEW - DataFlow parser
│   └── query-builder.ts        # NEW - SQL builder
├── components/
│   └── formula-builder.tsx    # NEW - Formula UI
├── app/
│   └── api/
│       └── reporting-studio/
│           └── query/
│               └── route.ts    # NEW - Server queries
├── electron-builder.config.js  # NEW - Build config
└── package.json                # UPDATED
```

---

## Testing Checklist

### Desktop App
- [ ] Install dependencies: `npm install`
- [ ] Run dev: `npm run electron:dev`
- [ ] Window opens and loads app
- [ ] Can load Excel file
- [ ] Works offline (disconnect internet)
- [ ] Can save report locally
- [ ] Can load saved report

### Formula Language
- [ ] Formula parser works: `TOTAL(amount)` → `SUM(amount)`
- [ ] Formula builder UI shows functions
- [ ] Can insert columns into formula
- [ ] SQL generation works
- [ ] Query execution works (offline)

---

## Troubleshooting

### Issue: Electron won't start
**Solution:**
1. Make sure Next.js is running: `npm run dev`
2. Wait 2-3 seconds for Next.js to start
3. Then run: `npm run electron:dev`

### Issue: DuckDB not found
**Solution:**
```bash
npm install duckdb
```

### Issue: Formula parsing errors
**Solution:**
- Check function names (must be uppercase: `TOTAL`, not `total`)
- Check column names match exactly
- Use quotes for strings: `CONCAT(name, " ", surname)`

---

## Next Steps

1. **Test desktop app** - Run `npm run electron:dev`
2. **Test formulas** - Try `TOTAL(amount)` in formula builder
3. **Integrate** - Replace current formula evaluator
4. **Build** - Create installer with `npm run electron:build`

Everything is ready! 🚀

