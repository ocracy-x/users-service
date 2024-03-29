import { Storage } from '@google-cloud/storage';

// Instantiates a client. If you don't specify credentials when constructing
// the client, the client library will look for credentials in the
// environment.
const storage = new Storage();
// Makes an authenticated API request.
async function listBuckets() {
	try {
		const results = await storage.getBuckets();

		const [buckets] = results;

		console.log('Buckets:');
		buckets.forEach((bucket: any) => {
			console.log(bucket.name);
		});
	} catch (err) {
		console.error('ERROR:', err);
		process.exit();
	}
}
listBuckets();
