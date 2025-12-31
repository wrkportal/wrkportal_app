# How to Access and Use Predictive Analytics

## 🎯 Quick Access

**Navigate to:** `/reporting-studio/predictive-analytics`

Or click the **"Predictive Analytics"** card on the Reporting Studio landing page.

## 📊 Available Models

### 1. **Time Series Forecasting**

**What it does:** Predicts future values based on historical time series data.

**How to use:**
1. Select a dataset (or use sample data)
2. Choose a forecast method:
   - **Linear**: Simple linear trend
   - **Exponential Smoothing**: Weighted average of past values
   - **Moving Average**: Average of recent values
   - **Seasonal**: Accounts for seasonal patterns
3. Set the number of periods to forecast (e.g., 12 for 12 months)
4. Click "Generate Forecast"
5. View the forecast chart with confidence intervals

**Example Use Cases:**
- Sales forecasting
- Revenue predictions
- Demand planning
- Trend analysis

### 2. **Regression Analysis**

**What it does:** Analyzes relationships between variables and predicts outcomes.

**How to use:**
1. Go to the "Regression" tab
2. Choose regression type:
   - **Linear**: y = ax + b
   - **Polynomial**: y = ax² + bx + c
   - **Logistic**: For binary classification (0/1)
3. Enter your data in JSON format:
   ```json
   [
     {"x": 1, "y": 2},
     {"x": 2, "y": 4},
     {"x": 3, "y": 6},
     {"x": 4, "y": 8}
   ]
   ```
4. Click "Perform Regression"
5. View results:
   - Equation
   - R² Score (goodness of fit)
   - Mean Squared Error (MSE)
   - Mean Absolute Error (MAE)

**Example Use Cases:**
- Price vs. demand analysis
- Marketing spend vs. revenue
- Feature importance analysis

### 3. **Classification Models**

**What it does:** Trains models to classify data into categories.

**How to use:**
1. Go to the "Classification" tab
2. Choose a model:
   - **K-Nearest Neighbors (KNN)**: Simple, effective
   - **Decision Tree**: Easy to interpret
   - **Naive Bayes**: Fast, probabilistic
3. Set K value (for KNN)
4. Provide training and test datasets
5. View accuracy and predictions

**Example Use Cases:**
- Customer segmentation
- Fraud detection
- Quality classification
- Risk assessment

## 🔧 Using Your Own Data

### Option 1: Select from Existing Datasets
1. On the Predictive Analytics page, use the "Select Dataset" dropdown
2. Choose a dataset you've already created
3. The system will automatically detect date and numeric columns
4. Use the data for forecasting

### Option 2: Use Sample Data
- If no dataset is selected, sample time series data is provided
- Perfect for testing and learning the features

### Option 3: Manual Data Entry (Regression)
- For regression, paste JSON data directly
- Format: `[{"x": value1, "y": value2}, ...]`

## 📈 Example Workflows

### Forecasting Sales
1. Upload sales data with dates and amounts
2. Select the dataset
3. Choose "Seasonal" method (if you have monthly/quarterly patterns)
4. Set seasonality to 12 (for monthly data)
5. Forecast 12 periods ahead
6. View predictions with confidence intervals

### Analyzing Marketing ROI
1. Go to Regression tab
2. Enter data: `[{"x": marketing_spend, "y": revenue}, ...]`
3. Choose "Linear" regression
4. View R² score to see how well marketing spend predicts revenue
5. Use the equation to predict future revenue from marketing spend

### Classifying Customers
1. Prepare training data with features (age, income, purchases) and labels (high/low value)
2. Go to Classification tab
3. Choose "KNN" model
4. Train and test
5. Use the model to classify new customers

## 💡 Tips for Best Results

### Forecasting
- **More data = better predictions**: At least 12-24 data points recommended
- **Seasonal patterns**: Use "Seasonal" method if you see repeating patterns
- **Trend analysis**: Use "Linear" for steady trends
- **Noisy data**: Use "Moving Average" to smooth out fluctuations

### Regression
- **R² Score**: Closer to 1.0 is better (1.0 = perfect fit)
- **MSE/MAE**: Lower is better
- **Data quality**: Remove outliers for better results
- **Sample size**: At least 10-20 data points recommended

### Classification
- **Balanced data**: Try to have similar numbers of each class
- **Feature selection**: Use relevant features only
- **K value**: For KNN, start with k=3 or k=5
- **Training data**: Use 70-80% for training, 20-30% for testing

## 🚀 Next Steps

1. **Try the sample data** to get familiar with the interface
2. **Upload your own dataset** via Data Sources
3. **Experiment with different methods** to see which works best
4. **Export results** to use in dashboards or reports

## 📝 Notes

- All models run client-side for privacy
- Results are calculated in real-time
- No data is sent to external services
- Models are simplified versions - for production use, consider more advanced libraries

## 🆘 Troubleshooting

**"Insufficient Data" error:**
- Need at least 2 data points for forecasting
- Need at least 2 data points for regression
- Need training data for classification

**"No suitable data found":**
- Dataset doesn't have date and numeric columns
- Use sample data or check your dataset structure

**Poor forecast accuracy:**
- Try different methods
- Check for outliers
- Ensure data has a clear trend or pattern

**Low R² score:**
- Variables may not be related
- Try polynomial regression
- Check for non-linear relationships

---

**Ready to start?** Navigate to `/reporting-studio/predictive-analytics` and click through the tabs!

