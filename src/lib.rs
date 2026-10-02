#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env, Vec,
};

const TICKETS_PER_ROUND: u32 = 11;

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct RoomState {
    pub ticket_price: i128,
    pub round_id: u32,
    pub tickets_sold: u32,
    pub participants: Vec<Option<Address>>,
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

        // Precios con 7 decimales (Stroops):
        Self::init_room(&env, 0, 10_000_000);    // 1 USDC
        Self::init_room(&env, 1, 100_000_000);   // 10 USDC
        Self::init_room(&env, 2, 1_000_000_000); // 100 USDC
    }

    fn init_room(env: &Env, room_id: u32, price: i128) {
        let mut participants = Vec::new(env);
        for _ in 0..TICKETS_PER_ROUND {
            participants.push_back(None);
        }
        let state = RoomState {
            ticket_price: price,
            round_id: 1,
            tickets_sold: 0,
            participants,
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
            panic!("Cantidad de boletos invalida");
        }

        let total_cost = room.ticket_price * (count as i128);
        client.transfer(&buyer, &env.current_contract_address(), &total_cost);

        for ticket in tickets.iter() {
            if ticket < 1 || ticket > TICKETS_PER_ROUND {
                panic!("Boleto fuera de rango (1-11)");
            }
            let idx = ticket - 1;
            if room.participants.get(idx).unwrap().is_some() {
                panic!("Boleto ya ocupado");
            }
            room.participants.set(idx, Some(buyer.clone()));
            room.tickets_sold += 1;
        }

        if room.tickets_sold == TICKETS_PER_ROUND {
            // Anotación explícita de tipo para gen_range
            let winning_idx = env.prng().gen_range(0u64..11u64) as u32;
            let winner = room.participants.get(winning_idx).unwrap().unwrap();
            let prize = room.ticket_price * 10;

            client.transfer(&env.current_contract_address(), &winner, &prize);

            env.events().publish(
                (symbol_short!("draw"), room_id, room.round_id),
                (winning_idx + 1, winner, prize),
            );

            room.round_id += 1;
            room.tickets_sold = 0;
            let mut empty_participants = Vec::new(&env);
            for _ in 0..TICKETS_PER_ROUND {
                empty_participants.push_back(None);
            }
            room.participants = empty_participants;
        }

        env.storage().instance().set(&DataKey::Room(room_id), &room);
    }
}
