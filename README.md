# 🚗 Israel Vehicle Lookup

A modern, responsive web application for looking up Israeli vehicle information by license plate number, powered by official government data.

![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)
![React](https://img.shields.io/badge/React-19-61DAFB)
![Vite](https://img.shields.io/badge/Vite-5-646CFF)

## Features

- **Real vehicle data** from the official Israeli Ministry of Transport registry via [data.gov.il](https://data.gov.il)
- **License plate input** styled to resemble an Israeli registration plate (yellow background, IL strip)
- **Comprehensive vehicle details** organized into logical sections
- **Search history** with expandable entries, stored locally in the browser
- **Light & dark mode** with persistent theme preference
- **Fully responsive** design for desktop, tablet, and mobile
- **Numeric-only input** with paste sanitization and validation
- **Graceful error handling** for network failures, invalid plates, and missing vehicles

## Data Source

This application queries the **official Israeli government open data portal**:

- **Portal**: [data.gov.il](https://data.gov.il)
- **Dataset**: Private and Commercial Vehicles (כלי רכב פרטיים ומסחריים)
- **API**: CKAN `datastore_search` endpoint
- **Resource ID**: `053cea08-09bc-40ec-8f7a-156f0677aff3`
- **Access**: Public, no authentication required, CORS-enabled

### Available Fields

| Field | Description |
|-------|-------------|
| `mispar_rechev` | License plate number |
| `tozeret_nm` | Manufacturer name (Hebrew) |
| `kinuy_mishari` | Commercial model name |
| `degem_nm` | Model code |
| `shnat_yitzur` | Year of manufacture |
| `tzeva_rechev` | Vehicle color (Hebrew) |
| `sug_delek_nm` | Fuel type (Hebrew) |
| `baalut` | Ownership type (Hebrew) |
| `degem_manoa` | Engine model |
| `ramat_gimur` | Trim level |
| `ramat_eivzur_betihuty` | Safety equipment level |
| `kvutzat_zihum` | Pollution group |
| `zmig_kidmi` | Front tire size |
| `zmig_ahori` | Rear tire size |
| `mivchan_acharon_dt` | Last roadworthiness test date |
| `tokef_dt` | License validity date |
| `misgeret` | Chassis/frame number |
| `sug_degem` | Vehicle type (P=Private, M=Commercial) |
| `moed_aliya_lakvish` | On-road since date |

### Limitations

- **Coverage**: Active private vehicles manufactured from 1996 onward; commercial vehicles (up to 3,500 kg) from 1998 onward.
- **Not included**: Buses, heavy trucks, motorcycles older than the cutoff years, and deregistered vehicles are not in this specific dataset.
- **Language**: Manufacturer names, colors, fuel types, and ownership labels are in Hebrew as provided by the source.
- **Data freshness**: The dataset is maintained by the Israeli Ministry of Transport and updated periodically.
- **Informational only**: This data is for informational and transparency purposes; it is not an official certification.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ 
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── api.ts                  # API service (data.gov.il CKAN client)
├── types.ts                # TypeScript type definitions
├── validation.ts           # License plate validation & formatting
├── display.ts              # Display formatting utilities
├── history.ts              # localStorage history management
├── ThemeContext.tsx         # Theme context (light/dark mode)
├── App.tsx                 # Root component with routing
├── main.tsx                # Entry point
├── index.css               # Unified design system (CSS variables)
├── vite-env.d.ts           # Vite type declarations
├── components/
│   ├── Navbar.tsx           # Navigation bar with theme toggle
│   ├── PlateInput.tsx       # License plate input form
│   ├── VehicleResults.tsx   # Vehicle information display
│   └── ErrorDisplay.tsx     # Error states with retry
└── pages/
    └── HistoryPage.tsx      # Search history page
```

## Architecture Decisions

- **Frontend-only**: No backend, proxy, or serverless functions. All API calls go directly from the browser to data.gov.il.
- **CORS**: The data.gov.il API supports CORS, enabling direct browser access.
- **localStorage**: Search history and theme preference persist locally without any server.
- **CSS Variables**: A centralized design token system powers both light and dark themes.
- **Strict TypeScript**: Full strict mode with no `any` types.

## License

MIT
