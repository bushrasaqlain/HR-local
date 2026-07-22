import http from 'k6/http';
import { sleep, check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 50  },  // ramp up
    { duration: '1m',  target: 100 },  // hold
    { duration: '30s', target: 0   },  // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed:   ['rate<0.05'],
  },
};

const USER_ID = 168;
const JOB_ID  = 35;

export default function () {
  const res = http.get(
    `http://localhost:8080/applicant/applicantsData/${USER_ID}?job_id=${JOB_ID}&page=1&limit=50`
  );

  check(res, {
    'status 200':     (r) => r.status === 200,
    'has candidates': (r) => {
      try { return JSON.parse(r.body).candidate.length >= 0; }
      catch { return false; }
    },
    'under 2s': (r) => r.timings.duration < 2000,
  });

  sleep(1);
}