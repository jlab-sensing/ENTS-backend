import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
	const res = http.get('http://localhost:5006/dirtviz');
	sleep(1);
}
