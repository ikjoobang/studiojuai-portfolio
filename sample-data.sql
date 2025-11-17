-- Insert sample video projects
INSERT INTO projects (id, title, description, video_url, thumbnail_url, category, display_order, is_published) VALUES
('project-001', '브랜드 프로모션 영상', '감각적인 비주얼과 스토리텔링으로 제작된 브랜드 프로모션 영상', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg', 'Commercial', 1, 1),
('project-002', '제품 소개 영상', '제품의 특징과 장점을 효과적으로 전달하는 제품 소개 영상', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 'https://orange.blender.org/wp-content/themes/orange/images/media/header.jpg', 'Product', 2, 1),
('project-003', '기업 홍보 영상', '기업의 비전과 가치를 담은 기업 홍보 영상', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', '', 'Corporate', 3, 1);
