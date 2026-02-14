import { learningTopics, type LearningTopic } from '../data/learning-topics';
import './LearningTopics.css';

interface LearningTopicsProps {
    isOpen: boolean;
    onTopicSelect: (topic: LearningTopic) => void;
    onClose: () => void;
}

export function LearningTopics({ isOpen, onTopicSelect, onClose }: LearningTopicsProps) {
    if (!isOpen) return null;

    return (
        <div className="learning-topics-overlay" onClick={onClose}>
            <div className="learning-topics-panel" onClick={(e) => e.stopPropagation()}>
                <div className="learning-topics-header">
                    <h2>📚 何を学びますか？</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="learning-topics-content">
                    <p className="learning-topics-intro">
                        学びたい内容を選びましょう。分からないことがあれば、自由に質問をどうぞ。
                    </p>

                    {learningTopics.map((category) => (
                        <section key={category.category} className="topic-category">
                            <h3 className="category-title">
                                <span className="category-icon">{category.icon}</span>
                                {category.category}
                            </h3>
                            <div className="topic-grid">
                                {category.topics.map((topic) => (
                                    <button
                                        key={topic.id}
                                        className="topic-card"
                                        onClick={() => {
                                            onTopicSelect(topic);
                                            onClose();
                                        }}
                                    >
                                        <div className="topic-title">{topic.title}</div>
                                        <div className="topic-description">{topic.description}</div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="learning-topics-footer">
                    <p>💡 どのトピックから始めても構いません。自分のペースで進めていきましょう。</p>
                </div>
            </div>
        </div>
    );
}
