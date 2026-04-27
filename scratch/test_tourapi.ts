import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TOURAPI_KEY = process.env.TOURAPI_KEY;
const BASE_URL = process.env.TOURAPI_BASE_URL || 'https://apis.data.go.kr/B551011/KorService1';

async function testTourAPI() {
    console.log('Testing TourAPI with key:', TOURAPI_KEY ? 'FOUND' : 'NOT FOUND');
    console.log('Using Base URL:', BASE_URL);
    
    if (!TOURAPI_KEY) {
        console.error('TOURAPI_KEY is missing in .env.local');
        return;
    }

    const baseUrls = [
        'https://api.data.go.kr/openapi'
    ];

    const endpoints = [
        '/tn_pubr_public_trrsrt_api'
    ];

    for (const baseUrl of baseUrls) {
        for (const endpoint of endpoints) {
            try {
                const url = `${baseUrl}${endpoint}`;
                console.log(`\nChecking: ${url}`);
                
                const response = await axios.get(url, {
                    params: {
                        serviceKey: TOURAPI_KEY, // Try original key first
                        MobileApp: 'Dongple',
                        MobileOS: 'ETC',
                        _type: 'json',
                        numOfRows: 1,
                        pageNo: 1,
                        eventStartDate: '20260401'
                    },
                    timeout: 5000
                });

                console.log('Status:', response.status);
                console.log('Full Response:', JSON.stringify(response.data, null, 2));
                if (response.data?.response?.header?.resultCode === '0000' || response.data?.response?.header?.resultCode === '00') {
                    console.log('!!! SUCCESS !!!');
                    return;
                } else {
                    console.log('Result:', response.data?.response?.header?.resultCode, response.data?.response?.header?.resultMsg);
                }
            } catch (error: any) {
                console.log('Error:', error.message);
            }
        }
    }
}

testTourAPI();
