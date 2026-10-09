#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

#[contracttype]
#[derive(Clone)]
pub struct Boleto {
    pub numero: u32,
    pub dueno: Address,
    pub precio: i128,
    pub timestamp_compra: u64,
}

#[contracttype]
pub enum DataKey {
    Admin,
    TokenXlm,
    Boleto(u32),
    TotalVendidos,
    PrecioTicket,
}

const REEMBOLSO_TIEMPO_SEGUNDOS: u64 = 30 * 24 * 60 * 60; // 30 días en segundos

#[contract]
pub struct ATomarOnceContract;

#[contractimpl]
impl ATomarOnceContract {
    
    // Inicializar el contrato de la rifa de 11 boletos
    pub fn initialize(env: Env, admin: Address, token_xlm: Address, precio_ticket: i128) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("El contrato ya esta inicializado");
        }
        admin.require_auth();
        
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenXlm, &token_xlm);
        env.storage().instance().set(&DataKey::PrecioTicket, &precio_ticket);
        env.storage().instance().set(&DataKey::TotalVendidos, &0u32);
    }

    // Comprar un boleto (hasta completar los 11)
    pub fn comprar_boleto(env: Env, comprador: Address, numero_boleto: u32) {
        comprador.require_auth();

        if numero_boleto == 0 || numero_boleto > 11 {
            panic!("Numero de boleto invalido (debe ser entre 1 y 11)");
        }

        if env.storage().persistent().has(&DataKey::Boleto(numero_boleto)) {
            panic!("El boleto ya esta vendido");
        }

        let total_vendidos: u32 = env.storage().instance().get(&DataKey::TotalVendidos).unwrap_or(0);
        if total_vendidos >= 11 {
            panic!("La ronda de 11 boletos ya esta completa");
        }

        let precio: i128 = env.storage().instance().get(&DataKey::PrecioTicket).unwrap();
        let token_xlm: Address = env.storage().instance().get(&DataKey::TokenXlm).unwrap();

        // Transferir fondos del usuario al contrato
        let token_client = token::Client::new(&env, &token_xlm);
        token_client.transfer(&comprador, &env.current_contract_address(), &precio);

        // Registrar boleto con el timestamp actual del ledger
        let timestamp_actual = env.ledger().timestamp();
        let boleto = Boleto {
            numero: numero_boleto,
            dueno: comprador.clone(),
            precio,
            timestamp_compra: timestamp_actual,
        };

        env.storage().persistent().set(&DataKey::Boleto(numero_boleto), &boleto);
        env.storage().instance().set(&DataKey::TotalVendidos, &(total_vendidos + 1));
    }

    // Reembolsar boleto si pasan 30 días sin completarse la ronda
    pub fn reembolsar_boleto(env: Env, usuario: Address, numero_boleto: u32) {
        usuario.require_auth();

        let total_vendidos: u32 = env.storage().instance().get(&DataKey::TotalVendidos).unwrap_or(0);
        if total_vendidos >= 11 {
            panic!("La ronda ya fue completada, no aplican reembolsos por expiracion");
        }

        let key = DataKey::Boleto(numero_boleto);
        let boleto: Boleto = env.storage().persistent().get(&key).unwrap_or_else(|| {
            panic!("El boleto no existe o no ha sido vendido");
        });

        if boleto.dueno != usuario {
            panic!("No eres el dueño de este boleto");
        }

        let ahora = env.ledger().timestamp();
        if ahora < boleto.timestamp_compra + REEMBOLSO_TIEMPO_SEGUNDOS {
            panic!("Aun no expira el periodo de 30 dias para reembolso");
        }

        // Devolver fondos al usuario
        let token_xlm: Address = env.storage().instance().get(&DataKey::TokenXlm).unwrap();
        let token_client = token::Client::new(&env, &token_xlm);
        token_client.transfer(&env.current_contract_address(), &usuario, &boleto.precio);

        // Remover boleto y decrementar el contador de vendidos
        env.storage().persistent().remove(&key);
        env.storage().instance().set(&DataKey::TotalVendidos, &(total_vendidos - 1));
    }

    // Rescatar fondos huérfanos enviados por error (Solo Admin)
    pub fn rescatar_fondos_huerfanos(env: Env, monto: i128, destino: Address) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let token_xlm: Address = env.storage().instance().get(&DataKey::TokenXlm).unwrap();
        let token_client = token::Client::new(&env, &token_xlm);
        
        let balance_contrato = token_client.balance(&env.current_contract_address());
        
        // Calcular el pozo legítimo retenido por los boletos vendidos actuales
        let total_vendidos: u32 = env.storage().instance().get(&DataKey::TotalVendidos).unwrap_or(0);
        let precio_ticket: i128 = env.storage().instance().get(&DataKey::PrecioTicket).unwrap_or(0);
        let pozo_legitimo = (total_vendidos as i128) * precio_ticket;

        if balance_contrato - pozo_legitimo < monto {
            panic!("El monto excede los fondos huerfanos disponibles");
        }

        token_client.transfer(&env.current_contract_address(), &destino, &monto);
    }
}
