# Figure manifest

Dataset: [Global Shark Attacks, Kaggle](https://www.kaggle.com/datasets/teajay/global-shark-attacks/data), supplied locally as `attacks.csv`. All figures use 6,129 cleaned records from 1800–2018. Earlier analysis cited approximately 6,302 records; this run yields 6,129 under the filters documented below.

## Source-column mapping

Raw headers were trimmed and matched case-insensitively. Duplicate Case Number columns were detected and ignored after the first occurrence.

| Logical variable | Raw column | Column position |
|---|---|---:|
| case_number | Case Number | 1 |
| date | Date | 2 |
| year | Year | 3 |
| type | Type | 4 |
| country | Country | 5 |
| area | Area | 6 |
| location | Location | 7 |
| activity | Activity | 8 |
| name | Name | 9 |
| sex | Sex  | 10 |
| age | Age | 11 |
| injury | Injury | 12 |
| fatal | Fatal (Y/N) | 13 |
| time | Time | 14 |
| species | Species  | 15 |
| investigator_or_source | Investigator or Source | 16 |

Ignored duplicate metadata: Case Number (column 20), Case Number (column 21). Also ignored: pdf, href formula, href, original order, and unnamed columns.

## Cleaning rules

- Empty trailing rows removed; exact duplicate incident rows checked across all logical fields (0 removed). Distinct victims sharing a case number are retained.
- Years must be four digits from 1800 through the current year; no missing year is inferred.
- Fatal values: Y/y = Fatal; N/n = Non-fatal; all others = Unknown. 597 unknown outcomes are excluded from rate denominators.
- Activity assignment uses the first matching group in this order: Boating / Watercraft, Fishing, Surfing, Diving, Shallow Water, Swimming. Blank/unusable = Unknown; other usable descriptions = Other. This includes spearfishing under Fishing, snorkeling under Diving, and bathing under Shallow Water.
- Species assignment: White, Tiger, Bull, Blacktip, Nurse, Hammerhead, then other named species. Generic, missing, unconfirmed, and ambiguous species descriptions remain Unknown Species. No species is inferred from injury.
- Age Available requires a numeric age 0–110, an approximate numeric age, or a bounded numeric range within 0–110. Vague descriptions remain Age Missing/Unusable.
- Country aliases merge only obvious equivalents. No coordinates or exposure denominators are inferred.
- Figure 2 excludes decades with fewer than 20 known outcomes; Figures 5 and 7 require at least 30 known outcomes; Figure 10 requires at least 30 records per type. Excluded groups remain in derived CSVs with `eligible=false`.

## Figures

### Figure 1

- Title: Recorded Shark Attacks Have Increased Over Time
- Source columns: Year
- Filters: Valid 1800–2018 years
- Aggregation: Count incidents by year; zero-fill intervening years
- Sample size: 6,129 records
- Calculation: count(records)
- Output: `figures/fig01_attacks_over_time.png`, `figures/fig01_attacks_over_time.svg`
- Takeaway: Annual recorded incidents rise over the historical series; this is a reporting count, not individual risk.

### Figure 2

- Title: Recorded Encounters Increased, but Fatality Has Declined
- Source columns: Year; Fatal (Y/N)
- Filters: Valid years; known fatal outcomes; decades with n >= 20
- Aggregation: Group by decade
- Sample size: 5,483 known-outcome records
- Calculation: fatal / (fatal + non-fatal) × 100
- Output: `figures/fig02_fatality_rate_over_time.png`, `figures/fig02_fatality_rate_over_time.svg`
- Takeaway: The pooled rate in the first three plotted decades is 65.4%, versus 10.8% in the last three.

### Figure 3

- Title: Where Have Shark Attacks Been Recorded?
- Source columns: Country
- Filters: Valid years; specified country; top 15
- Aggregation: Count incidents by normalized country
- Sample size: 5,047 records
- Calculation: count(records)
- Output: `figures/fig03_attacks_by_country.png`, `figures/fig03_attacks_by_country.svg`
- Takeaway: United States has the highest recorded count (2,205); counts are not personal risk.

### Figure 4

- Title: What Were People Doing When Encounters Occurred?
- Source columns: Activity
- Filters: Valid years; all activity categories retained
- Aggregation: Count incidents by mutually exclusive activity category
- Sample size: 6,129 records
- Calculation: count(records)
- Output: `figures/fig04_incidents_by_activity.png`, `figures/fig04_incidents_by_activity.svg`
- Takeaway: Surfing has the most recorded incidents among activity categories.

### Figure 5

- Title: Frequent Activities Are Not Necessarily the Most Fatal
- Source columns: Activity; Fatal (Y/N)
- Filters: Known fatal outcomes; activity categories with n >= 30
- Aggregation: Group by activity category
- Sample size: 5,532 known-outcome records
- Calculation: fatal / (fatal + non-fatal) × 100
- Output: `figures/fig05_fatality_by_activity.png`, `figures/fig05_fatality_by_activity.svg`
- Takeaway: Surfing has the most incidents, while Boating / Watercraft has the highest recorded fatality rate.

### Figure 6

- Title: Which Sharks Appear Most Often in Recorded Encounters?
- Source columns: Species
- Filters: Valid years; all species categories, including unknown
- Aggregation: Count incidents by mutually exclusive species category
- Sample size: 6,129 records
- Calculation: count(records)
- Output: `figures/fig06_incidents_by_species.png`, `figures/fig06_incidents_by_species.svg`
- Takeaway: White Shark is the most frequently identified shark category; unknown species remain a large group.

### Figure 7

- Title: The Most Frequently Recorded Sharks Are Not Automatically the Most Fatal
- Source columns: Species; Fatal (Y/N)
- Filters: Identified species; known fatal outcomes; n >= 30
- Aggregation: Group by species category
- Sample size: 1,606 known-outcome records
- Calculation: fatal / (fatal + non-fatal) × 100
- Output: `figures/fig07_fatality_by_species.png`, `figures/fig07_fatality_by_species.svg`
- Takeaway: White Shark is most frequently identified; Tiger Shark has the highest rate among displayed identified categories.

### Figure 8

- Title: Incidents With an Unidentified Shark Show a Different Outcome Pattern
- Source columns: Species; Fatal (Y/N)
- Filters: Known fatal outcomes; all species statuses
- Aggregation: Identified versus unknown species
- Sample size: 5,532 known-outcome records
- Calculation: fatal / (fatal + non-fatal) × 100 within each status
- Output: `figures/fig08_known_vs_unknown_species.png`, `figures/fig08_known_vs_unknown_species.svg`
- Takeaway: Unknown-species incidents have a 26.9% recorded fatality rate versus 15.3% for identified species; this is an association.

### Figure 9

- Title: A Large Share of Records Do Not Contain Usable Age Information
- Source columns: Age
- Filters: All valid 1800–2018 incidents
- Aggregation: Age available versus missing/unusable
- Sample size: 6,129 records
- Calculation: status count / all incidents × 100
- Output: `figures/fig09_age_data_completeness.png`, `figures/fig09_age_data_completeness.svg`
- Takeaway: 45.2% of cleaned incidents lack usable age information.

### Figure 10

- Title: Missing Information Is Not Evenly Distributed
- Source columns: Type; Age
- Filters: Incident types with n >= 30
- Aggregation: Missing-age count divided by type total
- Sample size: 6,125 records
- Calculation: missing age / all records in type × 100
- Output: `figures/fig10_missing_age_by_incident_type.png`, `figures/fig10_missing_age_by_incident_type.svg`
- Takeaway: Boating has 89.0% missing age, versus 37.4% for Unprovoked.

## Derived data

See `derived_data/` for cleaned incidents, each chart aggregation, the cleaning audit, and render specifications. Rates in CSVs are stored as percentages at full precision; figure labels use one decimal place.
