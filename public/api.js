export const api = {
  async fetchProblems(type = 'build-circuit') {
    const res = await fetch(`/api/problems?type=${type}`);
    const json = await res.json();
    if (!json.success) throw new Error('문제 로드 실패');
    return json.data;
  },

  async grade(problemId, payload) {
    const res = await fetch(`/api/grade/${problemId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error('채점 오류');
    return json.data;
  },

  async gradeCode(problemId, payload) {
    const res = await fetch(`/api/grade-code/${problemId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error('채점 오류');
    return json.data;
  },
};