import json
from datetime import datetime
import calendar
import os

# Configuration: Array of year filenames to process
YEAR_FILES = ["2019.json", "2020.json"]  # Add more years as needed

def get_first_day_of_month(year, month_name):
    """Get the first day of the month in YYYY-MM-DD format"""
    month_num = list(calendar.month_name).index(month_name)
    return f"{year}-{month_num:02d}-01"

def extract_advance_transactions():
    """Extract advance transactions from multiple year data files"""
    transactions = {}
    
    for year_file in YEAR_FILES:
        # Extract year from filename (assuming format: "YYYY.json")
        year = year_file.split('.')[0]
        
        print(f"Processing {year_file}...")
        
        # Check if file exists
        if not os.path.exists(year_file):
            print(f"Warning: {year_file} not found, skipping...")
            continue
        
        try:
            with open(year_file, 'r', encoding='utf-8') as file:
                data = json.load(file)
        except Exception as e:
            print(f"Error reading {year_file}: {e}")
            continue
        
        # Process the year data
        if year in data and 'shops' in data[year]:
            for shop_id, shop_data in data[year]['shops'].items():
                tenant_name = shop_data['tenant']['name']
                
                # Initialize if not exists
                if shop_id not in transactions:
                    transactions[shop_id] = []
                
                if 'monthlyData' in shop_data:
                    for month_name, month_data in shop_data['monthlyData'].items():
                        if month_data.get('advanceUsed', 0) > 0:
                            transaction = {
                                "name": tenant_name,
                                "type": "Advance Deduction",
                                "amount": month_data['advanceUsed'],
                                "date": get_first_day_of_month(int(year), month_name),
                                "description": f"Advance used for rent {month_name} {year}"
                            }
                            transactions[shop_id].append(transaction)
        else:
            print(f"Warning: Invalid structure in {year_file}")
    
    # Filter out shops with no transactions
    transactions = {shop_id: shop_transactions for shop_id, shop_transactions in transactions.items() if shop_transactions}
    
    return transactions

def update_data_json(transactions):
    """Update data.json with the extracted transactions"""
    # Read existing data.json
    with open('data.json', 'r', encoding='utf-8') as file:
        data = json.load(file)
    
    # Update or add advanceTransactions
    data['advanceTransactions'] = transactions
    
    # Write back to file
    with open('data.json', 'w', encoding='utf-8') as file:
        json.dump(data, file, indent=2, ensure_ascii=False)

def main():
    print("Extracting advance transactions from multiple year data files...")
    print(f"Processing files: {YEAR_FILES}")
    
    # Extract transactions
    transactions = extract_advance_transactions()
    
    # Count total transactions
    total_transactions = sum(len(shop_transactions) for shop_transactions in transactions.values())
    total_shops = len(transactions)
    
    print(f"\nFound {total_transactions} advance transactions across {total_shops} shops")
    
    # Update data.json
    update_data_json(transactions)
    
    print("Successfully updated data.json with advance transactions")
    print("\nShops with transactions:")
    
    # Print summary
    for shop_id, shop_transactions in transactions.items():
        print(f"{shop_id}: {len(shop_transactions)} transactions")
        for transaction in shop_transactions:
            print(f"  - {transaction['date']}: {transaction['amount']} ({transaction['description']})")

if __name__ == "__main__":
    main() 