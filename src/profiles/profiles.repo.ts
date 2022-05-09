import {
	DocumentData,
	DocumentSnapshot,
	Firestore,
} from '@google-cloud/firestore';
import { CRUD } from '../util';

export interface ProfileConfig {
	readonly id?: string;
	readonly username: string;
	readonly joined?: Date;
}

export class Profile {
	private readonly _id?: string;
	public get id(): string {
		return this._id ? this._id : 'no-key';
	}
	public get hasId(): boolean {
		return !!this._id;
	}

	public readonly username: string;
	public readonly joined: Date;
	constructor(config: ProfileConfig) {
		this._id = config.id;
		this.username = config.username;
		this.joined = config.joined ? config.joined : new Date();
	}

	toJson(): Object {
		return {
			id: this.id,
			username: this.username,
			joined: this.joined.toUTCString(),
		};
	}

	static fromJson(json: any): Profile {
		const username: string = json.username;
		const id = json.id;
		const joined = json.joined ? new Date(json.joined) : undefined;
		return new Profile({ id, username, joined });
	}
}

export abstract class ProfilesRepo extends CRUD<Profile> {
	constructor() {
		super('profiles');
	}

	abstract getAll(): Promise<Profile[]>;
}

export class FirestoreProfilesRepo extends ProfilesRepo {
	// converter documentation:
	// https://firebase.google.com/docs/reference/node/firebase.firestore.FirestoreDataConverter
	private converter = {
		toFirestore(profile: Profile): DocumentData {
			return profile.toJson();
		},
		fromFirestore(snapshot: DocumentSnapshot): Profile {
			const data = snapshot.data();
			if (!data) {
				throw Error('Firestore snapshot has no data for Profile: ' + data);
			}
			return Profile.fromJson(data);
		},
	};

	private store = new Firestore();
	private profiles = this.store
		.collection(this.key)
		.withConverter(this.converter);

	async getAll(): Promise<Profile[]> {
		const snapshot = await this.profiles.get();
		const profiles = snapshot.docs.map((doc) => Profile.fromJson(doc.data()));
		return profiles;
	}

	// no overwrites allowed
	async create(item: Profile): Promise<Profile | void> {
		const exists = await this.read(item.username);
		if (exists) return;
		const ref = await this.profiles.add(item);
		const doc = await ref.get();
		return doc.data();
	}
	async read(username: string): Promise<Profile | void> {
		const snapshot = await this.profiles
			.where('username', '==', username)
			.limit(1)
			.get();
		const list = snapshot.docs.map((doc) => doc.data());
		if (!list.length) return;
		return list[0];
	}
	async update(item: Profile): Promise<Profile> {
		await this.profiles.doc(item.username).set(item, { merge: false });
		return item;
	}

	async delete(id: string): Promise<void> {
		await this.profiles.doc(id).delete();
	}
}
