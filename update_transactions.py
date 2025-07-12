import json
from datetime import datetime
import calendar
import os
import re

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
        
        if year in data and 'shops' in data[year]:
            for shop_id, shop_data in data[year]['shops'].items():
                tenant_name = shop_data['tenant']['name']
                
                # Shop IDs with suffixes (S-030-A, S-030-B, etc.) are already in the data
                # No need to manually generate suffixes
                
                shop_transactions = []
                
                if 'monthlyData' in shop_data:
                    monthly_data = shop_data['monthlyData']
                    
                    # Process each month
                    for month_name, month_data in monthly_data.items():
                        if 'advanceUsed' in month_data and month_data['advanceUsed'] > 0:
                            transaction = {
                                "name": tenant_name,
                                "type": "Advance Deduction",
                                "amount": month_data['advanceUsed'],
                                "date": get_first_day_of_month(year, month_name),
                                "description": f"Advance used for rent {month_name} {year}"
                            }
                            shop_transactions.append(transaction)
                
                # Only add shops that have transactions
                if shop_transactions:
                    transactions[shop_id] = shop_transactions
                    print(f"  Added {len(shop_transactions)} transactions for {shop_id} ({tenant_name})")
    
    return transactions

def update_data_json(transactions):
    """Update the data.json file with the extracted transactions"""
    try:
        # Read existing data.json
        with open('data.json', 'r', encoding='utf-8') as file:
            data = json.load(file)
        
        # Update the advanceTransactions section
        data['advanceTransactions'] = transactions
        
        # Write back to file
        with open('data.json', 'w', encoding='utf-8') as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
        
        print(f"\nSuccessfully updated data.json with {len(transactions)} shops")
        total_transactions = sum(len(shop_transactions) for shop_transactions in transactions.values())
        print(f"Total transactions: {total_transactions}")
        
    except Exception as e:
        print(f"Error updating data.json: {e}")

if __name__ == "__main__":
    print("Extracting advance transactions from year files...")
    transactions = extract_advance_transactions()
    
    if transactions:
        print(f"\nFound transactions for {len(transactions)} shops")
        update_data_json(transactions)
    else:
        print("No transactions found!") 