# 🥖☕ a Tomar Once

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue.svg)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart_Contracts-7A28CB.svg)](https://soroban.stellar.org)
[![Rust](https://img.shields.io/badge/Rust-Wasm-orange.svg)](https://www.rust-lang.org)
[![Vite](https://img.shields.io/badge/Frontend-Vite-646CFF.svg)](https://vitejs.dev/)
[![PM2](https://img.shields.io/badge/Process_Manager-PM2-2B037A.svg)](https://pm2.keymetrics.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Una **rifa descentralizada de 11 boletos** inspirada en la clásica merienda de media tarde chilena ("tomar once"), construida sobre **Soroban Smart Contracts** en la red **Stellar (Testnet)** y desplegada con **Vite + PM2** en un VPS.

---

## 🎲 ¿Cómo Funciona la Rifa?

1. **Rondas de 11 Boletos**: Cada ronda cuenta con un cupo exacto de **11 boletos** disponibles para compra, haciendo honor al concepto de "la once".
2. **Compra de Boletos**: Los participantes conectan su billetera de Stellar (ej. Freighter) en la Testnet y compran uno o más boletos disponibles pagando el valor establecido por boleto.
3. **Cierre de la Ronda**: En cuanto se vende el boleto número 11, la ronda queda cerrada para nuevas compras.
4. **Sorteo y Ganador On-Chain**: El smart contract ejecuta la selección del boleto ganador de forma transparente y verificable en Soroban.
5. **Entrega del Pozo**: El premio acumulado se transfiere directamente a la billetera del boleto ganador y se da inicio a una nueva ronda.

---

## 🛠️ Requisitos del Sistema

- **Rust**: Versión estable con target `wasm32-unknown-unknown`.
- **Stellar CLI**: Para compilar, desplegar e interactuar con los contratos.
- **Node.js**: `>= 18.x` y gestor de paquetes (`npm` o `pnpm`).
- **PM2**: Administrador de procesos para producción en VPS.
- **Billetera Stellar**: Freighter Wallet configurada en red Testnet.

---

## 📦 1. Configuración de Entorno en el VPS

Instala las herramientas base si aún no las tienes configuradas:

```bash
# Dependencias del sistema
sudo apt update && sudo apt install -y build-essential curl git pkg-config libssl-dev

# Rust y target wasm
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustup target add wasm32-unknown-unknown

# Stellar CLI
cargo install --locked stellar-cli --features opt

# Node.js LTS y PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

---

## 🦀 2. Smart Contract (Soroban en Testnet)

### Configurar Red e Identidad

```bash
# Registrar la red Testnet
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Generar y fondear cuenta deployer
stellar keys generate --global deployer --network testnet
stellar keys fund deployer --network testnet
```

### Compilar y Desplegar el Contrato

```bash
# Compilar el contrato Wasm
stellar contract build

# Desplegar en Testnet
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/a_tomar_once.wasm \
  --source deployer \
  --network testnet)

echo "Contrato desplegado con ID: $CONTRACT_ID"
```

### Inicializar la Rifa

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin deployer \
  --ticket_price 10000000
```

---

## ⚡ 3. Despliegue del Frontend (Vite + PM2)

El frontend está desarrollado con Vite y se sirve en producción en el VPS mediante PM2.

### Configuración de Variables de Entorno

Crea o edita tu archivo `.env` en la raíz del frontend:

```bash
cat << 'ENV' > .env
VITE_STELLAR_NETWORK=TESTNET
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org:443
VITE_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
VITE_CONTRACT_ID=TU_CONTRACT_ID_AQUI
ENV
```

### Compilar y Servir con PM2

```bash
# 1. Instalar dependencias
npm install

# 2. Generar build de producción con Vite
npm run build

# 3. Servir con PM2 en modo SPA (ejemplo en puerto 3000)
pm2 serve dist 3000 --spa --name "a-tomar-once-frontend"

# 4. Guardar lista de procesos PM2 para inicio automático
pm2 save
pm2 startup
```

### Monitoreo del Frontend

```bash
pm2 status
pm2 logs a-tomar-once-frontend
```

---

## 🧪 Pruebas Unitarias del Contrato

Para correr las pruebas de lógica de la rifa en entorno local:

```bash
cargo test
```

---

## 📁 Estructura del Repositorio

```text
a-tomar-once/
├── contracts/
│   └── a-tomar-once/
│       ├── src/
│       │   ├── lib.rs       # Lógica de la rifa (11 boletos, compra, sorteo)
│       │   └── test.rs      # Pruebas del contrato con Soroban SDK
│       └── Cargo.toml
├── src/                     # Código fuente Frontend (Vite)
│   ├── components/          # Componentes de UI y modal "Cómo funciona"
│   └── ...
├── Cargo.toml               # Workspace manifest
├── package.json             # Dependencias y scripts de Node
├── vite.config.js           # Configuración del bundler Vite
└── README.md
```

---

## 👤 Autor

- **Yerko** - [@yerkobits](https://github.com/yerkobits)

---

## 📄 Licencia

Este proyecto se distribuye bajo la Licencia MIT. Consulta el archivo `LICENSE` para más información.
