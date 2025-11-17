import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database
  R2: R2Bucket
  OPENAI_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ==================== API Routes ====================

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Get all published projects
app.get('/api/projects', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, title, description, video_url, thumbnail_url, category, display_order
      FROM projects 
      WHERE is_published = 1 
      ORDER BY display_order ASC, created_at DESC
    `).all()
    
    return c.json({ success: true, projects: results })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return c.json({ success: false, error: 'Failed to fetch projects' }, 500)
  }
})

// Get single project
app.get('/api/projects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const project = await c.env.DB.prepare(`
      SELECT id, title, description, video_url, thumbnail_url, category, display_order
      FROM projects 
      WHERE id = ? AND is_published = 1
    `).bind(id).first()
    
    if (!project) {
      return c.json({ success: false, error: 'Project not found' }, 404)
    }
    
    return c.json({ success: true, project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return c.json({ success: false, error: 'Failed to fetch project' }, 500)
  }
})

// ==================== Admin CMS Routes ====================

// Admin login check (simple password auth)
app.post('/api/admin/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    // Simple auth check (password: admin123)
    if (username === 'admin' && password === 'admin123') {
      return c.json({ 
        success: true, 
        token: 'simple-admin-token',
        message: 'Login successful' 
      })
    }
    
    return c.json({ success: false, error: 'Invalid credentials' }, 401)
  } catch (error) {
    return c.json({ success: false, error: 'Login failed' }, 500)
  }
})

// Get all projects (including unpublished) - Admin only
app.get('/api/admin/projects', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM projects 
      ORDER BY display_order ASC, created_at DESC
    `).all()
    
    return c.json({ success: true, projects: results })
  } catch (error) {
    console.error('Error fetching admin projects:', error)
    return c.json({ success: false, error: 'Failed to fetch projects' }, 500)
  }
})

// Create new project - Admin only
app.post('/api/admin/projects', async (c) => {
  try {
    const { title, description, video_url, thumbnail_url, category, display_order } = await c.req.json()
    const id = `project-${Date.now()}-${Math.random().toString(36).substring(7)}`
    
    await c.env.DB.prepare(`
      INSERT INTO projects (id, title, description, video_url, thumbnail_url, category, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, title, description || '', video_url, thumbnail_url || '', category || '', display_order || 0).run()
    
    return c.json({ success: true, id, message: 'Project created successfully' })
  } catch (error) {
    console.error('Error creating project:', error)
    return c.json({ success: false, error: 'Failed to create project' }, 500)
  }
})

// Update project - Admin only
app.put('/api/admin/projects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { title, description, video_url, thumbnail_url, category, display_order, is_published } = await c.req.json()
    
    await c.env.DB.prepare(`
      UPDATE projects 
      SET title = ?, description = ?, video_url = ?, thumbnail_url = ?, 
          category = ?, display_order = ?, is_published = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title, 
      description || '', 
      video_url, 
      thumbnail_url || '', 
      category || '', 
      display_order || 0, 
      is_published !== undefined ? is_published : 1,
      id
    ).run()
    
    return c.json({ success: true, message: 'Project updated successfully' })
  } catch (error) {
    console.error('Error updating project:', error)
    return c.json({ success: false, error: 'Failed to update project' }, 500)
  }
})

// Delete project - Admin only
app.delete('/api/admin/projects/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    await c.env.DB.prepare(`
      DELETE FROM projects WHERE id = ?
    `).bind(id).run()
    
    return c.json({ success: true, message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Error deleting project:', error)
    return c.json({ success: false, error: 'Failed to delete project' }, 500)
  }
})

// Upload video to R2
app.post('/api/admin/upload-video', async (c) => {
  try {
    const body = await c.req.arrayBuffer()
    const key = `videos/${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`
    
    await c.env.R2.put(key, body, {
      httpMetadata: {
        contentType: 'video/mp4'
      }
    })
    
    // Return public URL (you'll need to configure R2 public access)
    const videoUrl = `https://studiojuai-videos.r2.dev/${key}`
    
    return c.json({ success: true, video_url: videoUrl, key })
  } catch (error) {
    console.error('Error uploading video:', error)
    return c.json({ success: false, error: 'Failed to upload video' }, 500)
  }
})

// GPT-4 mini chatbot endpoint
app.post('/api/chat', async (c) => {
  try {
    const { message } = await c.req.json()
    
    if (!c.env.OPENAI_API_KEY) {
      return c.json({ success: false, error: 'OpenAI API key not configured' }, 500)
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for studiojuai.club, a video portfolio website. Answer questions about video production, creative services, and help users navigate the portfolio.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })
    
    const data = await response.json() as any
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error')
    }
    
    const reply = data.choices[0].message.content
    
    return c.json({ success: true, reply })
  } catch (error) {
    console.error('Error in chat:', error)
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Chat failed' 
    }, 500)
  }
})

// ==================== Frontend Pages ====================

// Main portfolio page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>studiojuai.club (Portfolio)</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
        <style>
            * {
                font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
            }
            
            body {
                background: #FFFFFF;
                color: #000000;
            }
            
            /* Typography System */
            .headline {
                font-size: 48px;
                font-weight: 800;
                line-height: 1.3;
            }
            
            .subheadline {
                font-size: 28px;
                font-weight: 700;
                line-height: 1.4;
            }
            
            .body-text {
                font-size: 16px;
                font-weight: 400;
                line-height: 1.6;
            }
            
            .emphasis {
                font-size: 24px;
                font-weight: 600;
            }
            
            /* Spacing System */
            .section-spacing {
                padding: 100px 0;
            }
            
            .card-spacing {
                gap: 28px;
            }
            
            /* Button Style */
            .cta-button {
                padding: 16px 40px;
                font-size: 16px;
                font-weight: 600;
                border-radius: 6px;
                transition: all 0.3s ease;
            }
            
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
            }
            
            /* Card Style */
            .portfolio-card {
                background: #FFFFFF;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                transition: all 0.3s ease;
            }
            
            .portfolio-card:hover {
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
                transform: translateY(-4px);
            }
            
            /* Video Player */
            .video-container {
                position: relative;
                padding-bottom: 56.25%;
                height: 0;
                overflow: hidden;
            }
            
            .video-container video {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            }
            
            /* Chatbot */
            #chatbot-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 380px;
                max-height: 600px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                display: none;
                flex-direction: column;
                z-index: 1000;
            }
            
            #chatbot-container.open {
                display: flex;
            }
            
            #chat-toggle {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 60px;
                height: 60px;
                background: #FF6B35;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(255, 107, 53, 0.3);
                z-index: 999;
                transition: all 0.3s ease;
            }
            
            #chat-toggle:hover {
                transform: scale(1.1);
            }
            
            @media (max-width: 768px) {
                .headline {
                    font-size: 32px;
                }
                
                .subheadline {
                    font-size: 22px;
                }
                
                .section-spacing {
                    padding: 60px 0;
                }
                
                #chatbot-container {
                    width: calc(100vw - 32px);
                    right: 16px;
                    bottom: 16px;
                }
            }
        </style>
    </head>
    <body class="bg-white text-black">
        <!-- Hero Section -->
        <section class="section-spacing" style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);">
            <div class="max-w-6xl mx-auto px-6 text-center text-white">
                <h1 class="headline mb-6">Video Portfolio</h1>
                <p class="body-text mb-8 max-w-2xl mx-auto opacity-95">
                    창의적인 영상 작업을 통해 브랜드의 스토리를 전달합니다
                </p>
                <div class="flex gap-4 justify-center flex-wrap">
                    <a href="#portfolio" class="cta-button bg-white text-black">
                        포트폴리오 보기
                    </a>
                    <a href="#contact" class="cta-button bg-transparent text-white border-2 border-white">
                        문의하기
                    </a>
                </div>
            </div>
        </section>

        <!-- Portfolio Grid Section -->
        <section id="portfolio" class="section-spacing">
            <div class="max-w-7xl mx-auto px-6">
                <h2 class="subheadline text-center mb-12">작업물</h2>
                <div id="portfolio-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 card-spacing">
                    <!-- Projects will be loaded here -->
                    <div class="col-span-full text-center text-gray-500">
                        <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
                        <p>포트폴리오를 불러오는 중...</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Contact Section -->
        <section id="contact" class="section-spacing bg-gray-50">
            <div class="max-w-4xl mx-auto px-6 text-center">
                <h2 class="subheadline mb-6">Contact</h2>
                <p class="body-text mb-8 text-gray-600">
                    프로젝트 문의나 협업 제안은 언제든지 환영합니다
                </p>
                <div class="flex flex-col items-center gap-4">
                    <a href="mailto:studio.ikjoo@gmail.com" class="emphasis text-black hover:text-[#FF6B35] transition-colors">
                        <i class="fas fa-envelope mr-3"></i>
                        studio.ikjoo@gmail.com
                    </a>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-black text-white py-8">
            <div class="max-w-7xl mx-auto px-6 text-center">
                <p class="body-text">
                    <a href="https://studiojuai.club" class="hover:text-[#FF6B35] transition-colors">studiojuai.club</a> | 
                    studio.ikjoo@gmail.com | 
                    © 2025. ALL RIGHTS RESERVED.
                </p>
            </div>
        </footer>

        <!-- Chatbot Toggle Button -->
        <div id="chat-toggle" onclick="toggleChatbot()">
            <i class="fas fa-comments text-white text-2xl"></i>
        </div>

        <!-- Chatbot Container -->
        <div id="chatbot-container">
            <div class="bg-gradient-to-r from-[#FF6B35] to-[#FF8C42] p-4 rounded-t-2xl flex justify-between items-center">
                <h3 class="text-white font-bold">문의 챗봇</h3>
                <button onclick="toggleChatbot()" class="text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="chat-messages" class="flex-1 p-4 overflow-y-auto" style="max-height: 450px;">
                <div class="text-gray-500 text-sm text-center mb-4">
                    안녕하세요! 무엇을 도와드릴까요?
                </div>
            </div>
            <div class="p-4 border-t">
                <div class="flex gap-2">
                    <input 
                        type="text" 
                        id="chat-input" 
                        placeholder="메시지를 입력하세요..."
                        class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
                        onkeypress="if(event.key === 'Enter') sendMessage()"
                    />
                    <button 
                        onclick="sendMessage()"
                        class="bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-[#FF8C42] transition-colors"
                    >
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>

        <script>
            // Load portfolio projects
            async function loadProjects() {
                try {
                    const response = await fetch('/api/projects');
                    const data = await response.json();
                    
                    const grid = document.getElementById('portfolio-grid');
                    
                    if (data.success && data.projects.length > 0) {
                        grid.innerHTML = data.projects.map(project => \`
                            <div class="portfolio-card">
                                <div class="video-container">
                                    <video 
                                        src="\${project.video_url}" 
                                        poster="\${project.thumbnail_url || ''}"
                                        controls
                                        preload="metadata"
                                    ></video>
                                </div>
                                <div class="p-6">
                                    <h3 class="font-bold text-xl mb-2">\${project.title}</h3>
                                    \${project.description ? \`<p class="text-gray-600">\${project.description}</p>\` : ''}
                                    \${project.category ? \`<span class="inline-block mt-3 px-3 py-1 bg-gray-100 text-sm rounded">\${project.category}</span>\` : ''}
                                </div>
                            </div>
                        \`).join('');
                    } else {
                        grid.innerHTML = '<div class="col-span-full text-center text-gray-500"><p>아직 포트폴리오가 없습니다.</p></div>';
                    }
                } catch (error) {
                    console.error('Error loading projects:', error);
                    document.getElementById('portfolio-grid').innerHTML = 
                        '<div class="col-span-full text-center text-red-500"><p>포트폴리오를 불러오는데 실패했습니다.</p></div>';
                }
            }
            
            // Chatbot functions
            function toggleChatbot() {
                const container = document.getElementById('chatbot-container');
                const toggle = document.getElementById('chat-toggle');
                
                if (container.classList.contains('open')) {
                    container.classList.remove('open');
                    toggle.style.display = 'flex';
                } else {
                    container.classList.add('open');
                    toggle.style.display = 'none';
                }
            }
            
            async function sendMessage() {
                const input = document.getElementById('chat-input');
                const message = input.value.trim();
                
                if (!message) return;
                
                const messagesDiv = document.getElementById('chat-messages');
                
                // Add user message
                messagesDiv.innerHTML += \`
                    <div class="mb-3 text-right">
                        <div class="inline-block bg-[#FF6B35] text-white px-4 py-2 rounded-lg max-w-[80%]">
                            \${message}
                        </div>
                    </div>
                \`;
                
                input.value = '';
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
                
                // Show loading
                messagesDiv.innerHTML += \`
                    <div class="mb-3" id="loading-message">
                        <div class="inline-block bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">
                            <i class="fas fa-spinner fa-spin mr-2"></i>답변 생성 중...
                        </div>
                    </div>
                \`;
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
                
                try {
                    const response = await fetch('/api/chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ message })
                    });
                    
                    const data = await response.json();
                    
                    // Remove loading
                    document.getElementById('loading-message')?.remove();
                    
                    if (data.success) {
                        messagesDiv.innerHTML += \`
                            <div class="mb-3">
                                <div class="inline-block bg-gray-100 text-gray-800 px-4 py-2 rounded-lg max-w-[80%]">
                                    \${data.reply}
                                </div>
                            </div>
                        \`;
                    } else {
                        messagesDiv.innerHTML += \`
                            <div class="mb-3">
                                <div class="inline-block bg-red-100 text-red-600 px-4 py-2 rounded-lg max-w-[80%]">
                                    오류가 발생했습니다: \${data.error}
                                </div>
                            </div>
                        \`;
                    }
                } catch (error) {
                    document.getElementById('loading-message')?.remove();
                    messagesDiv.innerHTML += \`
                        <div class="mb-3">
                            <div class="inline-block bg-red-100 text-red-600 px-4 py-2 rounded-lg max-w-[80%]">
                                네트워크 오류가 발생했습니다.
                            </div>
                        </div>
                    \`;
                }
                
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            }
            
            // Load projects on page load
            loadProjects();
        </script>
    </body>
    </html>
  `)
})

// Admin CMS page
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>studiojuai.club (Admin)</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            * {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Login Screen -->
        <div id="login-screen" class="min-h-screen flex items-center justify-center">
            <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 class="text-2xl font-bold mb-6 text-center">Admin Login</h1>
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Username</label>
                    <input 
                        type="text" 
                        id="username" 
                        value="admin"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-2">Password</label>
                    <input 
                        type="password" 
                        id="password"
                        value="admin123"
                        class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onkeypress="if(event.key === 'Enter') login()"
                    />
                </div>
                <button 
                    onclick="login()"
                    class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Login
                </button>
                <p class="text-sm text-gray-500 mt-4 text-center">
                    Default: admin / admin123
                </p>
            </div>
        </div>

        <!-- Admin Dashboard -->
        <div id="admin-dashboard" class="hidden min-h-screen">
            <div class="bg-white shadow-sm border-b">
                <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 class="text-xl font-bold">studiojuai.club CMS</h1>
                    <button onclick="logout()" class="text-red-600 hover:text-red-700">
                        <i class="fas fa-sign-out-alt mr-2"></i>Logout
                    </button>
                </div>
            </div>

            <div class="max-w-7xl mx-auto px-6 py-8">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Portfolio Projects</h2>
                    <button 
                        onclick="showCreateModal()"
                        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <i class="fas fa-plus mr-2"></i>New Project
                    </button>
                </div>

                <div id="projects-list" class="space-y-4">
                    <div class="text-center text-gray-500 py-8">
                        <i class="fas fa-spinner fa-spin text-3xl mb-4"></i>
                        <p>Loading projects...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create/Edit Modal -->
        <div id="project-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div class="p-6 border-b flex justify-between items-center">
                    <h3 class="text-xl font-bold" id="modal-title">New Project</h3>
                    <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="p-6">
                    <input type="hidden" id="edit-project-id" />
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Title *</label>
                        <input 
                            type="text" 
                            id="project-title" 
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Project title"
                        />
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Description</label>
                        <textarea 
                            id="project-description" 
                            rows="4"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Project description"
                        ></textarea>
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Video URL *</label>
                        <input 
                            type="text" 
                            id="project-video-url" 
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/video.mp4"
                        />
                        <p class="text-xs text-gray-500 mt-1">Direct link to video file (mp4, webm, etc.)</p>
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Thumbnail URL</label>
                        <input 
                            type="text" 
                            id="project-thumbnail-url" 
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com/thumbnail.jpg"
                        />
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Category</label>
                        <input 
                            type="text" 
                            id="project-category" 
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Commercial, Music Video, etc."
                        />
                    </div>

                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Display Order</label>
                        <input 
                            type="number" 
                            id="project-order" 
                            value="0"
                            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p class="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                    </div>

                    <div class="mb-6">
                        <label class="flex items-center">
                            <input 
                                type="checkbox" 
                                id="project-published" 
                                checked
                                class="mr-2"
                            />
                            <span class="text-sm font-medium">Published (visible on website)</span>
                        </label>
                    </div>

                    <div class="flex gap-3">
                        <button 
                            onclick="saveProject()"
                            class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Save Project
                        </button>
                        <button 
                            onclick="closeModal()"
                            class="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let adminToken = null;
            
            async function login() {
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                
                try {
                    const response = await fetch('/api/admin/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        adminToken = data.token;
                        document.getElementById('login-screen').classList.add('hidden');
                        document.getElementById('admin-dashboard').classList.remove('hidden');
                        loadAdminProjects();
                    } else {
                        alert('Login failed: ' + data.error);
                    }
                } catch (error) {
                    alert('Login error: ' + error.message);
                }
            }
            
            function logout() {
                adminToken = null;
                document.getElementById('admin-dashboard').classList.add('hidden');
                document.getElementById('login-screen').classList.remove('hidden');
            }
            
            async function loadAdminProjects() {
                try {
                    const response = await fetch('/api/admin/projects');
                    const data = await response.json();
                    
                    const list = document.getElementById('projects-list');
                    
                    if (data.success && data.projects.length > 0) {
                        list.innerHTML = data.projects.map(project => \`
                            <div class="bg-white p-6 rounded-lg shadow-sm border">
                                <div class="flex justify-between items-start">
                                    <div class="flex-1">
                                        <h3 class="text-lg font-bold mb-2">\${project.title}</h3>
                                        <p class="text-gray-600 mb-2">\${project.description || 'No description'}</p>
                                        <div class="flex gap-3 text-sm text-gray-500">
                                            <span><i class="fas fa-video mr-1"></i>\${project.video_url.substring(0, 40)}...</span>
                                            \${project.category ? \`<span class="px-2 py-1 bg-gray-100 rounded">\${project.category}</span>\` : ''}
                                            <span class="px-2 py-1 \${project.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} rounded">
                                                \${project.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="flex gap-2 ml-4">
                                        <button 
                                            onclick='editProject(\${JSON.stringify(project).replace(/'/g, "\\'")})'
                                            class="text-blue-600 hover:text-blue-700 px-3 py-1"
                                        >
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button 
                                            onclick="deleteProject('\${project.id}')"
                                            class="text-red-600 hover:text-red-700 px-3 py-1"
                                        >
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        \`).join('');
                    } else {
                        list.innerHTML = '<div class="text-center text-gray-500 py-8"><p>No projects yet. Create your first one!</p></div>';
                    }
                } catch (error) {
                    console.error('Error loading projects:', error);
                }
            }
            
            function showCreateModal() {
                document.getElementById('modal-title').textContent = 'New Project';
                document.getElementById('edit-project-id').value = '';
                document.getElementById('project-title').value = '';
                document.getElementById('project-description').value = '';
                document.getElementById('project-video-url').value = '';
                document.getElementById('project-thumbnail-url').value = '';
                document.getElementById('project-category').value = '';
                document.getElementById('project-order').value = '0';
                document.getElementById('project-published').checked = true;
                document.getElementById('project-modal').classList.remove('hidden');
            }
            
            function editProject(project) {
                document.getElementById('modal-title').textContent = 'Edit Project';
                document.getElementById('edit-project-id').value = project.id;
                document.getElementById('project-title').value = project.title;
                document.getElementById('project-description').value = project.description || '';
                document.getElementById('project-video-url').value = project.video_url;
                document.getElementById('project-thumbnail-url').value = project.thumbnail_url || '';
                document.getElementById('project-category').value = project.category || '';
                document.getElementById('project-order').value = project.display_order || 0;
                document.getElementById('project-published').checked = project.is_published === 1;
                document.getElementById('project-modal').classList.remove('hidden');
            }
            
            function closeModal() {
                document.getElementById('project-modal').classList.add('hidden');
            }
            
            async function saveProject() {
                const id = document.getElementById('edit-project-id').value;
                const title = document.getElementById('project-title').value;
                const description = document.getElementById('project-description').value;
                const video_url = document.getElementById('project-video-url').value;
                const thumbnail_url = document.getElementById('project-thumbnail-url').value;
                const category = document.getElementById('project-category').value;
                const display_order = parseInt(document.getElementById('project-order').value);
                const is_published = document.getElementById('project-published').checked ? 1 : 0;
                
                if (!title || !video_url) {
                    alert('Title and Video URL are required!');
                    return;
                }
                
                try {
                    const url = id ? \`/api/admin/projects/\${id}\` : '/api/admin/projects';
                    const method = id ? 'PUT' : 'POST';
                    
                    const response = await fetch(url, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            title,
                            description,
                            video_url,
                            thumbnail_url,
                            category,
                            display_order,
                            is_published
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        closeModal();
                        loadAdminProjects();
                    } else {
                        alert('Error: ' + data.error);
                    }
                } catch (error) {
                    alert('Save error: ' + error.message);
                }
            }
            
            async function deleteProject(id) {
                if (!confirm('Are you sure you want to delete this project?')) {
                    return;
                }
                
                try {
                    const response = await fetch(\`/api/admin/projects/\${id}\`, {
                        method: 'DELETE'
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        loadAdminProjects();
                    } else {
                        alert('Delete error: ' + data.error);
                    }
                } catch (error) {
                    alert('Delete error: ' + error.message);
                }
            }
        </script>
    </body>
    </html>
  `)
})

export default app
