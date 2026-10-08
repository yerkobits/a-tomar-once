#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Map, Vec,
};

const TICKETS_PER_ROUND: u32 = 11;
const MAX_TICKETS_PER_PLAYER: u32 = 5; // Medida antibot: nadie puede tener más de 5 boletos en una mesa

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct RoomState {
    pub ticket_price: i128,
    pub round_id: u32,
    pub tickets_sold: u32,
    pub participants: Map<u32, Address>,
}

#[contracttype]
pub enum DataKey {
    Admin,
    TokenAddress,
    Room(u32),
}

#[contract]
pub struct ATomarOnceContract;

#[contractimpl]
impl ATomarOnceContract {
    pub fn init(env: Env, admin: Address, token_address: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Contrato ya inicializado");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenAddress, &token_address);

        Self::init_room(&env, 0, 10_000_000);    // 1 XLM
        Self::init_room(&env, 1, 100_000_000);   // 10 XLM
        Self::init_room(&env, 2, 1_000_000_000); // 100 XLM
    }

    fn init_room(env: &Env, room_id: u32, price: i128) {
        let state = RoomState {
            ticket_price: price,
            round_id: 1,
            tickets_sold: 0,
            participants: Map::new(env),
        };
        env.storage().instance().set(&DataKey::Room(room_id), &state);
    }

    pub fn get_room(env: Env, room_id: u32) -> RoomState {
        env.storage()
            .instance()
            .get(&DataKey::Room(room_id))
            .expect("Sala no encontrada")
    }

    pub fn buy_tickets(env: Env, buyer: Address, room_id: u32, tickets: Vec<u32>) {
        buyer.require_auth();

        let mut room: RoomState = env
            .storage()
            .instance()
            .get(&DataKey::Room(room_id))
            .expect("Sala no existe");

        let token_addr: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .expect("Token no configurado");

        let client = token::Client::new(&env, &token_addr);

        let count = tickets.len();
        if count == 0 || (room.tickets_sold + count) > TICKETS_PER_ROUND {
            panic!("Cantidad de boletos invalida o sala llena");
        }

        // --- MEDIDA ANTIBOT ON-CHAIN ---
        // Contar cuántos boletos ya posee este comprador en la ronda actual
        let mut user_tickets = 0u32;
        for seat in 1..=TICKETS_PER_ROUND {
            if let Some(owner) = room.participants.get(seat) {
                if owner == buyer {
                    user_tickets += 1;
                }
            }
        }

        if (user_tickets + count) > MAX_TICKETS_PER_PLAYER {
            panic!("Maximo 5 boletos por jugador por mesa para asegurar juego justo");
        }
        // ---------------------------------

        // Cobro total de boletos
        let total_cost = room.ticket_price * (count as i128);
        client.transfer(&buyer, &env.current_contract_address(), &total_cost);

        // Asignación de asientos
        for ticket in tickets.iter() {
            if ticket < 1 || ticket > TICKETS_PER_ROUND {
                panic!("Boleto fuera de rango (1-11)");
            }
            if room.participants.contains_key(ticket) {
                panic!("Boleto ya ocupado");
            }
            room.participants.set(ticket, buyer.clone());
            room.tickets_sold += 1;
        }

        // Si se completan los 11 boletos, ejecutar sorteo
        if room.tickets_sold == TICKETS_PER_ROUND {
            let winning_ticket = (env.prng().gen_range::<u64>(1..=11)) as u32;
            let winner = room.participants.get(winning_ticket).unwrap();
            let prize = room.ticket_price * 10;
            let dev_fee = room.ticket_price;
            let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();

            // Pagar al ganador y al dev
            client.transfer(&env.current_contract_address(), &winner, &prize);
            client.transfer(&env.current_contract_address(), &admin, &dev_fee);

            env.events().publish(
                (symbol_short!("draw"), room_id, room.round_id),
                (winning_ticket, winner, prize),
            );

            // Reiniciar sala para la siguiente ronda
            room.round_id += 1;
            room.tickets_sold = 0;
            room.participants = Map::new(&env);
        }

        env.storage().instance().set(&DataKey::Room(room_id), &room);
    }
}
