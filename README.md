# 🥖☕ a Tomar Once

[![Stellar](https://img.shields.io/badge/Stellar-Testnet-blue.svg)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart_Contracts-7A28CB.svg)](https://soroban.stellar.org)
[![Rust](https://img.shields.io/badge/Rust-Wasm-orange.svg)](https://www.rust-lang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> Una plataforma descentralizada inspirada en la tradición chilena de "tomar once": micro-donaciones, financiamiento colaborativo y apoyo a creadores construida sobre **Soroban Smart Contracts** en la red **Stellar (Testnet)**.

---

## 📋 Descripción

**a Tomar Once** reimagina el concepto de *"Buy Me a Coffee"* adaptado a la cultura chilena y potenciado por la velocidad y bajos costos de la red Stellar. Permite a creadores, proyectos o colectivos recibir apoyos ("onces") de manera no custodial, transparente y verificable mediante smart contracts en WebAssembly (Wasm).

---

## 🛠️ Tecnologías y Requisitos

- **Rust**: Versión estable con soporte para el target `wasm32-unknown-unknown`.
- **Stellar CLI**: CLI oficial de Stellar/Soroban.
- **Node.js** (Opcional si interactúas vía SDK/Frontend): `>= 18.x`.
- **VPS Linux** (Ubuntu/Debian recomendado).

### Instalación de dependencias en el VPS

```bash
# 1. Actualizar paquetes y dependencias base
sudo apt update && sudo apt install -y build-essential curl git pkg-config libssl-dev

# 2. Instalar Rust si aún no lo tienes
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# 3. Agregar target wasm
rustup target add wasm32-unknown-unknown

# 4. Instalar Stellar CLI
cargo install --locked stellar-cli --features opt
```

---

## 🚀 Inicio Rápido y Despliegue en Testnet

### 1. Clonar el repositorio

```bash
git clone https://github.com/yerkobits/a-tomar-once.git
cd a-tomar-once
```

### 2. Configurar la red Testnet e Identidad

Configura la red Testnet de Stellar y crea una cuenta para desplegar:

```bash
# Registrar la red Testnet
stellar network add \
  --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Generar clave para el administrador/deployer
stellar keys generate --global deployer --network testnet

# Fondear la cuenta usando Friendbot
stellar keys fund deployer --network testnet
```

### 3. Compilar los contratos

```bash
# Compilar y optimizar el binario Wasm
stellar contract build
```

El binario resultante se encontrará en `target/wasm32-unknown-unknown/release/`.

### 4. Desplegar en Testnet

```bash
# Desplegar contrato e instanciar Contract ID
CONTRACT_ID=$(stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/a_tomar_once.wasm \
  --source deployer \
  --network testnet)

echo "Contrato desplegado con ID: $CONTRACT_ID"
```

---

## 💻 Interacción con el Smart Contract

### Inicializar el contrato

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- \
  initialize \
  --admin deployer
```

### Invitar una Once (Ejemplo de función)

```bash
stellar contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- \
  invitar_once \
  --de deployer \
  --monto 1000
```

---

## 🧪 Pruebas Unitarias

Ejecuta el conjunto de tests en local:

```bash
cargo test
```

---

## 📁 Estructura del Proyecto

```text
a-tomar-once/
├── contracts/
│   └── a-tomar-once/
│       ├── src/
│       │   ├── lib.rs       # Lógica del contrato y métodos públicos
│       │   └── test.rs      # Tests con Soroban SDK
│       └── Cargo.toml
├── Cargo.toml               # Workspace manifest
└── README.md
```

---

## 👤 Autor

- **Yerko** - [@yerkobits](https://github.com/yerkobits)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
