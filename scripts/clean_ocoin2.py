#!/usr/bin/env python3
"""Aggressive OCoin cleanup from GamePersonalCenter.tsx"""
import re

with open('src/pages/GamePersonalCenter.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Remove any line containing oCoin/OCoin/ocoin (case insensitive)
filtered = []
skip_until_balanced = False
brace_count = 0
in_ocoin_block = False

i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    
    # Check if this line is OCoin-related
    is_ocoin = bool(re.search(r'[oO][cC]oin', line))
    
    if is_ocoin:
        # For state declarations, remove the entire useState block
        if 'useState' in stripped and '{' in stripped:
            brace_count = 1
            in_ocoin_block = True
            i += 1
            while i < len(lines) and brace_count > 0:
                brace_count += lines[i].count('{') - lines[i].count('}')
                i += 1
            continue
        
        # For function declarations, remove until closing brace
        if ('const ' in stripped or 'async' in stripped) and ('= (' in stripped or '=>' in stripped):
            # This is a function declaration - skip until the function ends
            brace_count = 0
            in_ocoin_block = True
            i += 1
            # Find opening brace
            while i < len(lines) and '{' not in lines[i]:
                i += 1
            brace_count = 1
            i += 1
            while i < len(lines) and brace_count > 0:
                brace_count += lines[i].count('{')
                brace_count -= lines[i].count('}')
                i += 1
            continue
        
        # For JSX blocks with oCoins, need to handle carefully
        if 'oCoins' in stripped and ('className' in stripped or 'onClick' in stripped):
            # Skip this line and potentially surrounding JSX structure
            i += 1
            continue
        
        # For other oCoin lines, just skip
        i += 1
        continue
    
    # Handle 'oCoins' in case statements (like switch cases)
    if "'oCoins'" in line:
        # Skip the case and its body
        indent = len(line) - len(line.lstrip())
        i += 1
        while i < len(lines):
            cur_indent = len(lines[i]) - len(lines[i].lstrip())
            if lines[i].strip() and cur_indent <= indent:
                break
            i += 1
        continue
    
    # Handle 'oCoins' | 'vouchers' in union types
    if "'oCoins'" in line or '"oCoins"' in line:
        i += 1
        continue
    
    # Remove lines referencing oCoin-related state setters
    if 'setOCoinMarketData' in line or 'setOCoinHoldings' in line or 'setOCoinTransactions' in line:
        i += 1
        continue
    if 'setShowOCoinDetails' in line or 'setShowOCoinTradeModal' in line:
        i += 1
        continue
    if 'setOCoinTradeType' in line or 'setOCoinTradeAmount' in line:
        i += 1
        continue
    
    filtered.append(line)
    i += 1

# Write back
with open('src/pages/GamePersonalCenter.tsx', 'w', encoding='utf-8') as f:
    f.writelines(filtered)

# Count remaining
with open('src/pages/GamePersonalCenter.tsx', 'r', encoding='utf-8') as f:
    remaining = [l.strip()[:120] for l in f if re.search(r'[oO][cC]oin', l)]

print(f'Remaining OCoin references: {len(remaining)}')
for r in remaining[:20]:
    print(f'  {r}')
