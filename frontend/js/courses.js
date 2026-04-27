/**
 * courses.js
 */

document.addEventListener("DOMContentLoaded", async () => {
    if (typeof apiFetch === 'undefined') return;

    const coursesGrid = document.getElementById("courses-grid");
    if (!coursesGrid) return; // not on courses page

    const courses = await apiFetch('/courses/');
    if (!courses) return;

    coursesGrid.innerHTML = "";
    courses.forEach(course => {
        const card = document.createElement("div");
        card.className = "course-card";
        card.style.setProperty('--course-color', course.color || '#4f8ef7');
        card.innerHTML = `
            <div class="course-card-icon">${course.icon || '📚'}</div>
            <h3 class="course-card-title">${course.title}</h3>
            <p class="course-card-desc">${course.description}</p>
            <div class="course-card-meta">
                <span class="course-badge">${course.difficulty || 'Mixed'}</span>
                <span class="course-badge">${course.total_units} Units</span>
            </div>
            <div class="course-progress-mini">
                <div class="cpm-label"><span>Progress</span><span>0%</span></div>
                <div class="cpm-bar"><div class="cpm-fill" style="width: 0%; background: ${course.color || '#4f8ef7'}"></div></div>
            </div>
        `;
        // Attach click listener
        card.addEventListener('click', () => openCourseDetail(course.id));
        coursesGrid.appendChild(card);
    });
    
    // Close detail panel
    const closeBtn = document.getElementById('close-detail-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('course-detail-panel').classList.remove('open');
        });
    }
});

async function openCourseDetail(courseId) {
    const data = await apiFetch(`/courses/${courseId}`);
    if (!data) return;

    // Populate header
    document.getElementById('detail-course-title').textContent = data.title;
    document.getElementById('detail-course-desc').textContent = data.description;
    
    // Render Units
    const accordion = document.getElementById('units-accordion');
    accordion.innerHTML = "";

    data.units.forEach((unit, uIdx) => {
        const unitDiv = document.createElement('div');
        unitDiv.className = 'unit-item';
        
        // Unit Header
        const header = document.createElement('div');
        header.className = 'unit-header';
        
        // Match CSS format for difficulty/xp
        const difficultyColor = unit.difficulty.toLowerCase() === 'hard' ? '#f43f5e' : (unit.difficulty.toLowerCase() === 'medium' ? '#f59e0b' : '#22c55e');
        
        header.innerHTML = `
            <div class="unit-difficulty-dot" style="background: ${difficultyColor};"></div>
            <div class="unit-name">Unit ${uIdx + 1}: ${unit.name}</div>
            <div class="unit-xp">${unit.base_xp || 100} XP</div>
            <div class="unit-chevron">▶</div>
        `;
        
        // Unit Body
        const body = document.createElement('div');
        body.className = 'unit-body';

        header.addEventListener('click', () => {
            unitDiv.classList.toggle('open');
        });

        // Topics list container
        const topicsList = document.createElement('div');
        topicsList.className = 'topics-list';

        // Topics, Notes and MCQs
        unit.topics.forEach((topic) => {
            const topicWrap = document.createElement('div');
            // topic-item is usually for list preview, but we'll use a modified generic block
            topicWrap.style = 'margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.06);';
            
            // Format notes
            let notesHtml = (topic.content_summary || "No notes available.");
            notesHtml = notesHtml.replace(/\n/g, '<br>').replace(/### (.*?)(<br>|$)/g, '<h4>$1</h4>');
            
            topicWrap.innerHTML = `
                <h3 style="color: var(--accent-blue); margin-bottom: 10px; font-size: 15px;">${topic.title}</h3>
                <div class="topic-notes" style="font-size: 13px; line-height: 1.6; color: var(--text-2); background: rgba(255,255,255,0.02); padding: 16px; border-radius: var(--radius-sm);">
                    ${notesHtml}
                </div>
            `;
            topicsList.appendChild(topicWrap);

            // Quizzes
            topic.quizzes.forEach(quiz => {
                const quizWrap = document.createElement('div');
                quizWrap.style = 'margin-top: 15px; padding: 20px; background: rgba(79, 142, 247, 0.05); border: 1px solid rgba(79, 142, 247, 0.2); border-radius: var(--radius-md);';
                
                let quizHtml = `<h4 style="margin-bottom:18px; color: var(--text-1); font-size: 14px;">📝 ${quiz.title}</h4>`;
                quiz.questions.forEach((q, qIdx) => {
                    quizHtml += `<div class="question-block" id="qb_${q.id}" style="margin-bottom: 20px;">
                        <p style="margin-bottom: 12px; font-size: 13.5px; color: var(--text-1);"><strong>Q${qIdx + 1}. ${q.text}</strong></p>\n`;
                    q.options.forEach(opt => {
                        quizHtml += `<label id="lbl_${opt.id}" style="display:flex; align-items:flex-start; gap:8px; margin-bottom: 8px; cursor: pointer; color: var(--text-2); font-size: 13px; transition: color 0.2s;">
                            <input type="radio" name="q_${q.id}" value="${opt.id}" style="margin-top: 2px;"> 
                            <span>${opt.text}</span>
                        </label>\n`;
                    });
                    quizHtml += `<div class="explanation" id="exp_${q.id}" style="display:none; margin-top:8px; font-size: 12px; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;"></div>`;
                    quizHtml += `</div>`;
                });

                quizHtml += `<button class="btn-primary quiz-submit-btn" style="width: 100%;">Submit Quiz</button>`;
                quizWrap.innerHTML = quizHtml;
                
                // Secure Real Life Submit API
                const submitBtn = quizWrap.querySelector('.quiz-submit-btn');
                submitBtn.addEventListener('click', async () => {
                    submitBtn.textContent = "Grading...";
                    submitBtn.style.pointerEvents = 'none';

                    // Collect answers
                    const answers = {};
                    quiz.questions.forEach(q => {
                        const selected = quizWrap.querySelector(`input[name="q_${q.id}"]:checked`);
                        if (selected) {
                            answers[q.id] = parseInt(selected.value);
                        }
                    });

                    // Lock all radio inputs
                    quizWrap.querySelectorAll('input[type="radio"]').forEach(rad => rad.disabled = true);

                    // Post to backend
                    const res = await apiFetch(`/quizzes/${quiz.id}/submit`, {
                        method: 'POST',
                        body: JSON.stringify({ answers })
                    });

                    if (!res || res.error) {
                        submitBtn.textContent = "Error calculating score";
                        return;
                    }

                    // Render Grading
                    quiz.questions.forEach(q => {
                        const r = res.results[q.id];
                        const expDiv = quizWrap.querySelector(`#exp_${q.id}`);
                        
                        // Colorize labels
                        if (r.selected_option_id) {
                            const lbl = quizWrap.querySelector(`#lbl_${r.selected_option_id}`);
                            if (r.correct) {
                                lbl.style.color = 'var(--accent-green)';
                                lbl.style.fontWeight = 'bold';
                            } else {
                                lbl.style.color = 'var(--accent-rose)';
                                lbl.style.textDecoration = 'line-through';
                            }
                        }
                        
                        // Always highlight correct answer
                        if (r.correct_option_id) {
                            const correctLbl = quizWrap.querySelector(`#lbl_${r.correct_option_id}`);
                            if (correctLbl) {
                                correctLbl.style.color = 'var(--accent-green)';
                                correctLbl.style.fontWeight = 'bold';
                            }
                        }

                        // Show Server-Side Explanation
                        if (expDiv && r.explanation) {
                            expDiv.innerHTML = `<strong>Explanation:</strong> ${r.explanation}`;
                            expDiv.style.display = 'block';
                            expDiv.style.color = r.correct ? 'var(--accent-green)' : 'var(--accent-rose)';
                            expDiv.style.background = r.correct ? 'rgba(34,197,94,0.1)' : 'rgba(244,63,94,0.1)';
                        }
                    });

                    submitBtn.textContent = `Score: ${res.score} / ${res.total}`;
                    submitBtn.style.background = res.score === res.total ? 'var(--accent-green)' : 'var(--accent-amber)';
                    submitBtn.style.color = '#fff';
                });
                
                topicsList.appendChild(quizWrap);
            });
        });

        body.appendChild(topicsList);
        unitDiv.appendChild(header);
        unitDiv.appendChild(body);
        accordion.appendChild(unitDiv);
    });

    document.getElementById('course-detail-panel').classList.add('open');
}
