#!/usr/bin/env python3
"""Clean OCoin references from GamePersonalCenter.tsx"""
import re

with open('src/pages/GamePersonalCenter.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove oCoin imports
content = re.sub(r"import oCoinService from '@/services/oCoinService';\n", '', content)
content = re.sub(
    r"import \{\s*\n\s*OCoinMarketData,\s*\n\s*OCoinUserBalance,\s*\n\s*OCoinTransaction,\s*\n\s*OCoinOption\s*\n\} from '@/types/oCoin';\n",
    '', content
)

# 2. Remove oCoin-related initial state loading calls
content = re.sub(
    r'    loadOCoinMarketData\(\);\n    loadOCoinHoldings\(\);\n    loadOCoinTransactions\(\);\n',
    '', content
)

# 3. Remove 'oCoins' from type unions
content = content.replace(
    "'cash' | 'gameCoin' | 'newDayGameCoin' | 'computingPower' | 'oCoins' | 'vouchers'",
    "'gameCoin' | 'vouchers'"
)
content = content.replace(
    "'cash' | 'newDayGameCoin' | 'computingPower' | 'oCoins' | 'vouchers'",
    "'vouchers'"
)

# 4. Remove oCoin from globalStats initialization
content = re.sub(
    r'\s*oCoinPrice: 0,\n\s*oCoinMarketCap: 0,\n\s*oCoinCirculatingSupply: 0,',
    '', content
)
# Remove duplicate (there are 2 occurrences)
content = re.sub(
    r'\s*oCoinPrice: 0,\n\s*oCoinMarketCap: 0,\n\s*oCoinCirculatingSupply: 0,',
    '', content
)

# 5. Remove EconomicSystemMonitor oCoinBalance prop
content = content.replace(
    '<EconomicSystemMonitor wallet={wallet} oCoinBalance={oCoinHoldings.balance} />',
    '<EconomicSystemMonitor wallet={wallet} />'
)

# Count remaining references
remaining = [l for l in content.split('\n') if 'oCoin' in l or 'OCoin' in l]
print(f'Remaining OCoin lines: {len(remaining)}')
for i, line in enumerate(remaining[:30]):
    print(f'  L{line.strip()[:120]}')

with open('src/pages/GamePersonalCenter.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('\nFile updated successfully.')
