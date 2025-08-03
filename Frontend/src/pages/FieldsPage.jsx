import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../styles/Fields.css";

const fieldsData = {
    orderFields: {
        currency: []
    },
    executorFields: {
        currency: [],
        role: []
    },
    clientFields: {
        source: [],
        category: [],
        country: [],
        currency: [],
        tag: []
    },
    employeeFields: {
        country: []
    },
    assetsFields: {
        currency: [],
        type: [],
        paymentSystem: [],
        cardDesigns: []
    },
    financeFields: {
        subcategory: [],
    }
};

const tabsConfig = [
    { key: 'orderFields', label: 'Поля заказа' },
    { key: 'executorFields', label: 'Поля исполнителя' },
    { key: 'clientFields', label: 'Поля клиента' },
    { key: 'employeeFields', label: 'Поля сотрудника' },
    { key: 'assetsFields', label: 'Поля активов' },
    { key: 'financeFields', label: 'Поля финансов' }
];

const initialValues = {
    orderFields: {
        intervals: [{ intervalValue: '' }],
        categories: [{ categoryInterval: '', categoryValue: '' }],
        currency: []
    },
    executorFields: {
        currency: [],
        role: []
    },
    clientFields: {
        source: [],
        category: [],
        country: [],
        currency: [],
        tag: []
    },
    employeeFields: {
        country: []
    },
    assetsFields: {
        currency: [],
        type: [],
        paymentSystem: [],
        cardDesigns: []
    },
    financeFields: {
        articles: [{ articleValue: '' }],
        subarticles: [{ subarticleInterval: '', subarticleValue: '' }],
        subcategory: []
    }
};

const IntervalFields = ({
    intervals,
    onIntervalChange,
    onAddInterval,
    onRemoveInterval
}) => {
    return (
        <div className="field-row">
            <label className="field-label">Интервал</label>
            <div className="category-fields-container">
                {intervals.map((interval, index) => (
                    <div key={index} className="category-field-group">
                        <div className="category-container">
                            <div className="category-full">
                                <input
                                    type="text"
                                    value={interval.intervalValue || ''}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onIntervalChange(index, 'intervalValue', e.target.value);
                                    }}
                                    placeholder="Введите интервал"
                                    className="text-input"
                                />
                            </div>
                            {intervals.length > 1 && (
                                <button
                                    className="remove-category-btn"
                                    onClick={() => onRemoveInterval(index)}
                                    title="Удалить интервал"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <button className="add-category-btn" onClick={onAddInterval}>
                    + Добавить интервал
                </button>
            </div>
        </div>
    );
};

const CategoryFields = ({
    categories,
    onCategoryChange,
    onAddCategory,
    onRemoveCategory,
    openDropdowns,
    onToggleDropdown,
    availableIntervals
}) => {
    return (
        <div className="field-row category-field">
            <label className="field-label">Категория</label>
            <div className="category-fields-container">
                {categories.map((category, index) => (
                    <div key={index} className="category-field-group">
                        <div className="category-container">
                            <div className="category-left">
                                <div className="dropdown-container">
                                    <div
                                        className={`dropdown-trigger-category ${category.categoryInterval ? 'has-value' : ''}`}
                                        onClick={(e) => onToggleDropdown(index, e)}
                                    >
                                        <span className="dropdown-value">
                                            {category.categoryInterval || 'Выберите интервал'}
                                        </span>
                                        <span className={`dropdown-arrow ${openDropdowns[`category-${index}-interval`] ? 'open' : ''}`}>▼</span>
                                    </div>
                                    <div className={`dropdown-menu ${openDropdowns[`category-${index}-interval`] ? 'open' : ''}`}>
                                        {availableIntervals.length > 0 ? (
                                            availableIntervals.map((option, optionIndex) => (
                                                <div
                                                    key={optionIndex}
                                                    className={`dropdown-option ${category.categoryInterval === option ? 'selected' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCategoryChange(index, 'categoryInterval', option);
                                                    }}
                                                >
                                                    {option}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="dropdown-option disabled-option">
                                                Сначала добавьте интервалы
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="category-right">
                                <input
                                    type="text"
                                    value={category.categoryValue || ''}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onCategoryChange(index, 'categoryValue', e.target.value);
                                    }}
                                    placeholder="Введите значение"
                                    className="text-input"
                                />
                            </div>
                            {categories.length > 1 && (
                                <button
                                    className="remove-category-btn"
                                    onClick={() => onRemoveCategory(index)}
                                    title="Удалить категорию"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <button className="add-category-btn" onClick={onAddCategory}>
                    + Добавить категорию
                </button>
            </div>
        </div>
    );
};

const ArticleFields = ({
    articles,
    onArticleChange,
    onAddArticle,
    onRemoveArticle
}) => {
    return (
        <div className="field-row">
            <label className="field-label">Статья</label>
            <div className="category-fields-container">
                {articles.map((article, index) => (
                    <div key={index} className="category-field-group">
                        <div className="category-container">
                            <div className="category-full">
                                <input
                                    type="text"
                                    value={article.articleValue || ''}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onArticleChange(index, 'articleValue', e.target.value);
                                    }}
                                    placeholder="Введите статью"
                                    className="text-input"
                                />
                            </div>
                            {articles.length > 1 && (
                                <button
                                    className="remove-category-btn"
                                    onClick={() => onRemoveArticle(index)}
                                    title="Удалить статью"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <button className="add-category-btn" onClick={onAddArticle}>
                    + Добавить статью
                </button>
            </div>
        </div>
    );
};

const SubarticleFields = ({
    subarticles,
    onSubarticleChange,
    onAddSubarticle,
    onRemoveSubarticle,
    openDropdowns,
    onToggleDropdown,
    availableArticles,
    fieldsData
}) => {
    return (
        <div className="field-row article-field">
            <label className="field-label">Подстатья</label>
            <div className="category-fields-container">
                {subarticles.map((subarticle, index) => (
                    <div key={index} className="category-field-group">
                        <div className="category-container">
                            <div className="category-left">
                                <div className="dropdown-container">
                                    <div
                                        className={`dropdown-trigger-article ${subarticle.subarticleInterval ? 'has-value' : ''}`}
                                        onClick={(e) => onToggleDropdown(index, e)}
                                    >
                                        <span className="dropdown-value">
                                            {subarticle.subarticleInterval || 'Выберите статью'}
                                        </span>
                                        <span className={`dropdown-arrow ${openDropdowns[`subarticle-${index}-interval`] ? 'open' : ''}`}>▼</span>
                                    </div>
                                    <div className={`dropdown-menu ${openDropdowns[`subarticle-${index}-interval`] ? 'open' : ''}`}>
                                        {availableArticles.length > 0 ? (
                                            availableArticles.map((option, optionIndex) => (
                                                <div
                                                    key={optionIndex}
                                                    className={`dropdown-option ${subarticle.subarticleInterval === option ? 'selected' : ''}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onSubarticleChange(index, 'subarticleInterval', option);
                                                    }}
                                                >
                                                    {option}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="dropdown-option disabled-option">
                                                Сначала добавьте статьи
                                            </div>
                                        )}
                                        {fieldsData.financeFields.subcategory.map((option, optionIndex) => (
                                            <div
                                                key={`subcategory-${optionIndex}`}
                                                className={`dropdown-option ${subarticle.subarticleInterval === option ? 'selected' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSubarticleChange(index, 'subarticleInterval', option);
                                                }}
                                            >
                                                {option}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="category-right">
                                <input
                                    type="text"
                                    value={subarticle.subarticleValue || ''}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onSubarticleChange(index, 'subarticleValue', e.target.value);
                                    }}
                                    placeholder="Введите значение"
                                    className="text-input"
                                />
                            </div>
                            {subarticles.length > 1 && (
                                <button
                                    className="remove-category-btn"
                                    onClick={() => onRemoveSubarticle(index)}
                                    title="Удалить подстатью"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <button className="add-category-btn" onClick={onAddSubarticle}>
                    + Добавить подстатью
                </button>
            </div>
        </div>
    );
};

const EditableList = ({ items, onAdd, onRemove, placeholder }) => {
    return (
        <div className="category-fields-container">
            {items.map((item, index) => (
                <div key={index} className="category-field-group">
                    <div className="category-container">
                        <div className="category-full">
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    const newItems = [...items];
                                    newItems[index] = newValue;
                                    onAdd(newItems);
                                }}
                                placeholder={placeholder}
                                className="text-input"
                            />
                        </div>
                        <button
                            className="remove-category-btn"
                            onClick={() => onRemove(index)}
                            title="Удалить"
                        >
                            ×
                        </button>
                    </div>
                </div>
            ))}
            <button
                className="add-category-btn"
                onClick={() => onAdd([...items, ''])}
            >
                + Добавить
            </button>
        </div>
    );
};

const CardDesignUpload = ({ cardDesigns, onAdd, onRemove }) => {
    const fileInputRefs = useRef([]);

    const handleFileUpload = (event, index) => {
        const files = Array.from(event.target.files);

        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newDesigns = [...cardDesigns];
                    newDesigns[index] = {
                        ...newDesigns[index],
                        id: newDesigns[index]?.id || Date.now() + Math.random(),
                        url: e.target.result,
                        size: file.size
                    };
                    onAdd(newDesigns);
                };
                reader.readAsDataURL(file);
            }
        }
        event.target.value = '';
    };

    const handleNameChange = (index, newName) => {
        const newDesigns = [...cardDesigns];
        newDesigns[index] = {
            ...newDesigns[index],
            name: newName
        };
        onAdd(newDesigns);
    };

    const addNewCardDesign = () => {
        const newDesigns = [...cardDesigns, { name: '', url: '', id: Date.now() + Math.random() }];
        onAdd(newDesigns);
    };

    const designs = cardDesigns.length > 0 ? cardDesigns : [{ name: '', url: '', id: Date.now() }];

    return (
        <div className="category-fields-container">
            {designs.map((design, index) => (
                <div key={design.id || index} className="category-field-group">
                    <div className="card-design-row">
                        <div className="card-design-input">
                            <input
                                type="text"
                                value={design.name || ''}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    handleNameChange(index, e.target.value);
                                }}
                                placeholder="Введите название дизайна"
                                className="text-input"
                            />
                        </div>
                        <div className="card-design-upload">
                            {design.url ? (
                                <div className="card-design-item">
                                    <div className="card-design-preview">
                                        <img
                                            src={design.url}
                                            alt={design.name}
                                            className="card-design-image"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <input
                                        ref={el => fileInputRefs.current[index] = el}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileUpload(e, index)}
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        className="upload-design-btn"
                                        onClick={() => fileInputRefs.current[index]?.click()}
                                    >
                                        + Загрузить изображение
                                    </button>
                                </>
                            )}
                        </div>
                        {(designs.length > 1 || design.url) && (
                            <button
                                className="remove-category-btn"
                                onClick={() => onRemove(index)}
                                title="Удалить дизайн"
                            >
                                ×
                            </button>
                        )}
                    </div>
                </div>
            ))}
            <button className="add-category-btn" onClick={addNewCardDesign}>
                + Добавить дизайн карты
            </button>
        </div>
    );
};

function Fields() {
    const [selectedValues, setSelectedValues] = useState(initialValues);
    const [savedValues, setSavedValues] = useState(initialValues);
    const [hasChanges, setHasChanges] = useState(false);
    const [activeTab, setActiveTab] = useState('orderFields');
    const [openDropdowns, setOpenDropdowns] = useState({});
    const containerRef = useRef(null);

    useEffect(() => {
        const saved = localStorage.getItem("fieldsData");

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const normalizedData = {
                    ...initialValues,
                    orderFields: {
                        ...initialValues.orderFields,
                        ...parsed.orderFields,
                        intervals: Array.isArray(parsed.orderFields?.intervals)
                            ? parsed.orderFields.intervals
                            : [{ intervalValue: '' }],
                        categories: Array.isArray(parsed.orderFields?.categories)
                            ? parsed.orderFields.categories
                            : [{ categoryInterval: '', categoryValue: '' }],
                        currency: Array.isArray(parsed.orderFields?.currency)
                            ? parsed.orderFields.currency
                            : []
                    },
                    executorFields: {
                        ...initialValues.executorFields,
                        ...parsed.executorFields,
                        currency: Array.isArray(parsed.executorFields?.currency) ? parsed.executorFields.currency : [],
                        role: Array.isArray(parsed.executorFields?.role) ? parsed.executorFields.role : []
                    },
                    clientFields: {
                        ...initialValues.clientFields,
                        ...parsed.clientFields,
                        source: Array.isArray(parsed.clientFields?.source) ? parsed.clientFields.source : [],
                        category: Array.isArray(parsed.clientFields?.category) ? parsed.clientFields.category : [],
                        country: Array.isArray(parsed.clientFields?.country) ? parsed.clientFields.country : [],
                        currency: Array.isArray(parsed.clientFields?.currency) ? parsed.clientFields.currency : [],
                        tag: Array.isArray(parsed.clientFields?.tag) ? parsed.clientFields.tag : []
                    },
                    employeeFields: {
                        ...initialValues.employeeFields,
                        ...parsed.employeeFields,
                        country: Array.isArray(parsed.employeeFields?.country) ? parsed.employeeFields.country : []
                    },
                    assetsFields: {
                        ...initialValues.assetsFields,
                        ...parsed.assetsFields,
                        currency: Array.isArray(parsed.assetsFields?.currency) ? parsed.assetsFields.currency : [],
                        type: Array.isArray(parsed.assetsFields?.type) ? parsed.assetsFields.type : [],
                        paymentSystem: Array.isArray(parsed.assetsFields?.paymentSystem) ? parsed.assetsFields.paymentSystem : [],
                        cardDesigns: Array.isArray(parsed.assetsFields?.cardDesigns) ? parsed.assetsFields.cardDesigns : []
                    },
                    financeFields: {
                        ...initialValues.financeFields,
                        ...parsed.financeFields,
                        articles: Array.isArray(parsed.financeFields?.articles)
                            ? parsed.financeFields.articles
                            : [{ articleValue: '' }],
                        subarticles: Array.isArray(parsed.financeFields?.subarticles)
                            ? parsed.financeFields.subarticles
                            : [{ subarticleInterval: '', subarticleValue: '' }],
                        subcategory: Array.isArray(parsed.financeFields?.subcategory)
                            ? parsed.financeFields.subcategory
                            : []
                    }
                };
                setSelectedValues(normalizedData);
                setSavedValues(normalizedData);
            } catch (error) {
                console.error('Error parsing saved data:', error);
                setSelectedValues(initialValues);
                setSavedValues(initialValues);
            }
        }
    }, []);

    const checkForChanges = (newValues) => {
        const changed = JSON.stringify(newValues) !== JSON.stringify(savedValues);
        if (hasChanges !== changed) {
            setHasChanges(changed);
        }
    };

    const handleSave = () => {
        setSavedValues(selectedValues);
        setHasChanges(false);
        localStorage.setItem("fieldsData", JSON.stringify(selectedValues));
    };

    const handleCancel = () => {
        const saved = localStorage.getItem("fieldsData");

        if (saved) {
            const parsed = JSON.parse(saved);
            setSelectedValues(parsed);
            setSavedValues(parsed);
        }

        setHasChanges(false);
        setOpenDropdowns({});
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpenDropdowns({});
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (fieldGroup, fieldName, value) => {
        const newValues = {
            ...selectedValues,
            [fieldGroup]: {
                ...selectedValues[fieldGroup],
                [fieldName]: value
            }
        };

        setSelectedValues(newValues);
        checkForChanges(newValues);

        setOpenDropdowns(prev => ({
            ...prev,
            [`${fieldGroup}-${fieldName}`]: false
        }));
    };

    const handleInputChange = (fieldGroup, fieldName, value) => {
        const newValues = {
            ...selectedValues,
            [fieldGroup]: {
                ...selectedValues[fieldGroup],
                [fieldName]: value
            }
        };

        setSelectedValues(newValues);
        checkForChanges(newValues);
    };

    const handleIntervalChange = (index, field, value) => {
        const currentIntervals = selectedValues.orderFields.intervals || [{ intervalValue: '' }];
        const newIntervals = [...currentIntervals];
        newIntervals[index] = {
            ...newIntervals[index],
            [field]: value
        };

        const newValues = {
            ...selectedValues,
            orderFields: {
                ...selectedValues.orderFields,
                intervals: newIntervals
            }
        };

        setSelectedValues(newValues);
        checkForChanges(newValues);
    };

    const handleCategoryChange = (index, field, value) => {
        const currentCategories = selectedValues.orderFields.categories || [{ categoryInterval: '', categoryValue: '' }];
        const newCategories = [...currentCategories];
        newCategories[index] = {
            ...newCategories[index],
            [field]: value
        };

        const newValues = {
            ...selectedValues,
            orderFields: {
                ...selectedValues.orderFields,
                categories: newCategories
            }
        };

        setSelectedValues(newValues);
        checkForChanges(newValues);

        if (field === 'categoryInterval') {
            setOpenDropdowns(prev => ({
                ...prev,
                [`category-${index}-interval`]: false
            }));
        }
    };

    const handleArticleChange = (index, field, value) => {
        const currentArticles = selectedValues.financeFields.articles || [{ articleValue: '' }];
        const newArticles = [...currentArticles];
        newArticles[index] = {
            ...newArticles[index],
            [field]: value
        };

        const newValues = {
            ...selectedValues,
            financeFields: {
                ...selectedValues.financeFields,
                articles: newArticles
            }
        };

        setSelectedValues(newValues);
        checkForChanges(newValues);
    };

    const handleSubarticleChange = (index, field, value) => {
        const currentSubarticles = selectedValues.financeFields.subarticles || [{ subarticleInterval: '', subarticleValue: '' }];
        const newSubarticles = [...currentSubarticles];
        newSubarticles[index] = {
            ...newSubarticles[index],
            [field]: value
        };

        const newValues = {
            ...selectedValues,
            financeFields: {
                ...selectedValues.financeFields,
                subarticles: newSubarticles
            }
        };

        setSelectedValues(newValues);
        checkForChanges(newValues);

        if (field === 'subarticleInterval') {
            setOpenDropdowns(prev => ({
                ...prev,
                [`subarticle-${index}-interval`]: false
            }));
        }
    };

    const addInterval = () => {
        const currentIntervals = selectedValues.orderFields.intervals || [{ intervalValue: '' }];
        const newIntervals = [...currentIntervals, { intervalValue: '' }];
        const newValues = {
            ...selectedValues,
            orderFields: {
                ...selectedValues.orderFields,
                intervals: newIntervals
            }
        };

        setSelectedValues(newValues);
        checkForChanges(newValues);
    };

    const addCategory = () => {
        const currentCategories = selectedValues.orderFields.categories || [{ categoryInterval: '', categoryValue: '' }];
        const newCategories = [...currentCategories, { categoryInterval: '', categoryValue: '' }];
        const newValues = {
            ...selectedValues,
            orderFields: {
                ...selectedValues.orderFields,
                categories: newCategories
            }
        };

        setSelectedValues(newValues);
        checkForChanges(newValues);
    };

    const addArticle = () => {
        const currentArticles = selectedValues.financeFields.articles || [{ articleValue: '' }];
        const newArticles = [...currentArticles, { articleValue: '' }];
        const newValues = {
            ...selectedValues,
            financeFields: {
                ...selectedValues.financeFields,
                articles: newArticles
            }
        };
        setSelectedValues(newValues);
        checkForChanges(newValues);
    };

    const addSubarticle = () => {
        const currentSubarticles = selectedValues.financeFields.subarticles || [{ subarticleInterval: '', subarticleValue: '' }];
        const newSubarticles = [...currentSubarticles, { subarticleInterval: '', subarticleValue: '' }];
        const newValues = {
            ...selectedValues,
            financeFields: {
                ...selectedValues.financeFields,
                subarticles: newSubarticles
            }
        };
        setSelectedValues(newValues);
        checkForChanges(newValues);
    };

    const removeInterval = (index) => {
        const currentIntervals = selectedValues.orderFields.intervals || [{ intervalValue: '' }];
        if (currentIntervals.length <= 1) return;

        const newIntervals = currentIntervals.filter((_, i) => i !== index);
        const newValues = {
            ...selectedValues,
            orderFields: {
                ...selectedValues.orderFields,
                intervals: newIntervals
            }
        };

        setSelectedValues(newValues);
        checkForChanges(newValues);
    };

    const removeCategory = (index) => {
        const currentCategories = selectedValues.orderFields.categories || [{ categoryInterval: '', categoryValue: '' }];
        if (currentCategories.length <= 1) return;

        const newCategories = currentCategories.filter((_, i) => i !== index);
        const newValues = {
            ...selectedValues,
            orderFields: {
                ...selectedValues.orderFields,
                categories: newCategories
            }
        };

        setSelectedValues(newValues);
        checkForChanges(newValues);
    };

    const removeArticle = (index) => {
        const currentArticles = selectedValues.financeFields.articles || [{ articleValue: '' }];
        if (currentArticles.length <= 1) return;

        const newArticles = currentArticles.filter((_, i) => i !== index);
        const newValues = {
            ...selectedValues,
            financeFields: {
                ...selectedValues.financeFields,
                articles: newArticles
            }
        };
        setSelectedValues(newValues);
        checkForChanges(newValues);
    };

    const removeSubarticle = (index) => {
        const currentSubarticles = selectedValues.financeFields.subarticles || [{ subarticleInterval: '', subarticleValue: '' }];
        if (currentSubarticles.length <= 1) return;

        const newSubarticles = currentSubarticles.filter((_, i) => i !== index);
        const newValues = {
            ...selectedValues,
            financeFields: {
                ...selectedValues.financeFields,
                subarticles: newSubarticles
            }
        };
        setSelectedValues(newValues);
        checkForChanges(newValues);
    };

    const toggleDropdown = (fieldGroup, fieldName, event) => {
        event.stopPropagation();
        const key = `${fieldGroup}-${fieldName}`;
        setOpenDropdowns(prev => {
            const newDropdowns = {};
            newDropdowns[key] = !prev[key];
            return newDropdowns;
        });
    };

    const toggleCategoryDropdown = (index, event) => {
        event.stopPropagation();
        const key = `category-${index}-interval`;
        setOpenDropdowns(prev => {
            const newDropdowns = {};
            newDropdowns[key] = !prev[key];
            return newDropdowns;
        });
    };

    const toggleSubarticleDropdown = (index, event) => {
        event.stopPropagation();
        const key = `subarticle-${index}-interval`;
        setOpenDropdowns(prev => {
            const newDropdowns = {};
            newDropdowns[key] = !prev[key];
            return newDropdowns;
        });
    };

    const getAvailableIntervals = () => {
        const intervals = selectedValues.orderFields.intervals || [];
        return intervals
            .map(interval => interval.intervalValue)
            .filter(value => value && value.trim() !== '');
    };

    const getAvailableArticles = () => {
        const articles = selectedValues.financeFields.articles || [];
        return articles
            .map(article => article.articleValue)
            .filter(value => value && value.trim() !== '');
    };

    const DropdownField = ({ fieldGroup, fieldName, label, options, placeholder, disabled = false }) => {
        const key = `${fieldGroup}-${fieldName}`;
        const isOpen = openDropdowns[key];
        const selectedValue = selectedValues[fieldGroup][fieldName];

        return (
            <div className={`field-row simple-field ${disabled ? 'disabled' : ''}`}>
                <label className="field-label">{label}</label>
                <div className="dropdown-container">
                    <div
                        className={`dropdown-trigger-simple ${selectedValue ? 'has-value' : ''} ${disabled ? 'disabled' : ''}`}
                        onClick={(e) => !disabled && toggleDropdown(fieldGroup, fieldName, e)}
                    >
                        <span className="dropdown-value">
                            {selectedValue || placeholder}
                        </span>
                        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
                    </div>
                    <div className={`dropdown-menu ${isOpen && !disabled ? 'open' : ''}`}>
                        {options.map((option, index) => (
                            <div
                                key={index}
                                className={`dropdown-option ${selectedValue === option ? 'selected' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(fieldGroup, fieldName, option);
                                }}
                            >
                                {option}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderActiveTabFields = () => {
        switch (activeTab) {
            case 'orderFields':
                return (
                    <div className="fields-vertical-grid">
                        <IntervalFields
                            intervals={selectedValues.orderFields.intervals || [{ intervalValue: '' }]}
                            onIntervalChange={handleIntervalChange}
                            onAddInterval={addInterval}
                            onRemoveInterval={removeInterval}
                        />

                        <CategoryFields
                            categories={selectedValues.orderFields.categories || [{ categoryInterval: '', categoryValue: '' }]}
                            onCategoryChange={handleCategoryChange}
                            onAddCategory={addCategory}
                            onRemoveCategory={removeCategory}
                            openDropdowns={openDropdowns}
                            onToggleDropdown={toggleCategoryDropdown}
                            availableIntervals={getAvailableIntervals()}
                        />
                        <div className="field-row">
                            <label className="field-label">Валюта</label>
                            <EditableList
                                items={selectedValues.orderFields.currency || []}
                                onAdd={(newItems) => handleInputChange('orderFields', 'currency', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.orderFields.currency || []).filter((_, i) => i !== index);
                                    handleInputChange('orderFields', 'currency', newItems);
                                }}
                                placeholder="Введите значение валюты"
                            />
                        </div>
                    </div>
                );

            case 'executorFields':
                return (
                    <div className="fields-vertical-grid">
                        <div className="field-row">
                            <label className="field-label">Валюта</label>
                            <EditableList
                                items={selectedValues.executorFields.currency || []}
                                onAdd={(newItems) => handleInputChange('executorFields', 'currency', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.executorFields.currency || []).filter((_, i) => i !== index);
                                    handleInputChange('executorFields', 'currency', newItems);
                                }}
                                placeholder="Введите значение валюты"
                            />
                        </div>
                        <div className="field-row">
                            <label className="field-label">Роль</label>
                            <EditableList
                                items={selectedValues.executorFields.role || []}
                                onAdd={(newItems) => handleInputChange('executorFields', 'role', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.executorFields.role || []).filter((_, i) => i !== index);
                                    handleInputChange('executorFields', 'role', newItems);
                                }}
                                placeholder="Введите роль"
                            />
                        </div>
                    </div>
                );
            case 'clientFields':
                return (
                    <div className="fields-vertical-grid">
                        <div className="field-row">
                            <label className="field-label">Категория</label>
                            <EditableList
                                items={selectedValues.clientFields.category || []}
                                onAdd={(newItems) => handleInputChange('clientFields', 'category', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.clientFields.category || []).filter((_, i) => i !== index);
                                    handleInputChange('clientFields', 'category', newItems);
                                }}
                                placeholder="Введите категорию"
                            />
                        </div>
                        <div className="field-row">
                            <label className="field-label">Источник</label>
                            <EditableList
                                items={selectedValues.clientFields.source || []}
                                onAdd={(newItems) => handleInputChange('clientFields', 'source', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.clientFields.source || []).filter((_, i) => i !== index);
                                    handleInputChange('clientFields', 'source', newItems);
                                }}
                                placeholder="Введите источник"
                            />
                        </div>
                        <div className="field-row">
                            <label className="field-label">Страна</label>
                            <EditableList
                                items={selectedValues.clientFields.country || []}
                                onAdd={(newItems) => handleInputChange('clientFields', 'country', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.clientFields.country || []).filter((_, i) => i !== index);
                                    handleInputChange('clientFields', 'country', newItems);
                                }}
                                placeholder="Введите страну"
                            />
                        </div>
                        <div className="field-row">
                            <label className="field-label">Валюта</label>
                            <EditableList
                                items={selectedValues.clientFields.currency || []}
                                onAdd={(newItems) => handleInputChange('clientFields', 'currency', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.clientFields.currency || []).filter((_, i) => i !== index);
                                    handleInputChange('clientFields', 'currency', newItems);
                                }}
                                placeholder="Введите валюту"
                            />
                        </div>
                        <div className="field-row">
                            <label className="field-label">Тег</label>
                            <EditableList
                                items={selectedValues.clientFields.tag || []}
                                onAdd={(newItems) => handleInputChange('clientFields', 'tag', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.clientFields.tag || []).filter((_, i) => i !== index);
                                    handleInputChange('clientFields', 'tag', newItems);
                                }}
                                placeholder="Введите тег"
                            />
                        </div>
                    </div>
                );
            case 'employeeFields':
                return (
                    <div className="fields-vertical-grid">
                        <div className="field-row">
                            <label className="field-label">Страна</label>
                            <EditableList
                                items={selectedValues.employeeFields.country || []}
                                onAdd={(newItems) => handleInputChange('employeeFields', 'country', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.employeeFields.country || []).filter((_, i) => i !== index);
                                    handleInputChange('employeeFields', 'country', newItems);
                                }}
                                placeholder="Введите страну"
                            />
                        </div>
                    </div>
                );
            case 'assetsFields':
                return (
                    <div className="fields-vertical-grid">
                        <div className="field-row">
                            <label className="field-label">Валюта счета</label>
                            <EditableList
                                items={selectedValues.assetsFields.currency || []}
                                onAdd={(newItems) => handleInputChange('assetsFields', 'currency', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.assetsFields.currency || []).filter((_, i) => i !== index);
                                    handleInputChange('assetsFields', 'currency', newItems);
                                }}
                                placeholder="Введите валюту счета"
                            />
                        </div>
                        <div className="field-row">
                            <label className="field-label">Тип</label>
                            <EditableList
                                items={selectedValues.assetsFields.type || []}
                                onAdd={(newItems) => handleInputChange('assetsFields', 'type', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.assetsFields.type || []).filter((_, i) => i !== index);
                                    handleInputChange('assetsFields', 'type', newItems);
                                }}
                                placeholder="Введите тип"
                            />
                        </div>
                        <div className="field-row">
                            <label className="field-label">Платежная система</label>
                            <EditableList
                                items={selectedValues.assetsFields.paymentSystem || []}
                                onAdd={(newItems) => handleInputChange('assetsFields', 'paymentSystem', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.assetsFields.paymentSystem || []).filter((_, i) => i !== index);
                                    handleInputChange('assetsFields', 'paymentSystem', newItems);
                                }}
                                placeholder="Введите платежную систему"
                            />
                        </div>
                        <div className="field-row">
                            <label className="field-label">Дизайн карты</label>
                            <CardDesignUpload
                                cardDesigns={selectedValues.assetsFields.cardDesigns || []}
                                onAdd={(newItems) => handleInputChange('assetsFields', 'cardDesigns', newItems)}
                                onRemove={(index) => {
                                    const newItems = (selectedValues.assetsFields.cardDesigns || []).filter((_, i) => i !== index);
                                    handleInputChange('assetsFields', 'cardDesigns', newItems);
                                }}
                            />
                        </div>
                    </div>
                );
            case 'financeFields':
                return (
                    <div className="fields-vertical-grid">
                        <ArticleFields
                            articles={selectedValues.financeFields?.articles || [{ articleValue: '' }]}
                            onArticleChange={handleArticleChange}
                            onAddArticle={addArticle}
                            onRemoveArticle={removeArticle}
                        />
                        <SubarticleFields
                            subarticles={selectedValues.financeFields?.subarticles || [{ subarticleInterval: '', subarticleValue: '' }]}
                            onSubarticleChange={handleSubarticleChange}
                            onAddSubarticle={addSubarticle}
                            onRemoveSubarticle={removeSubarticle}
                            openDropdowns={openDropdowns}
                            onToggleDropdown={toggleSubarticleDropdown}
                            availableArticles={getAvailableArticles()}
                            fieldsData={fieldsData}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div ref={containerRef} className="fields-main-container">
            <Sidebar />
        <div className="fields-main-container-wrapper">
            <div className="header">
                <div className="header-content">
                    <div className="header-left">
                        <h1 className="header-title">СПИСКИ</h1>
                    </div>
                    <div className="header-actions">
                        {hasChanges && (
                            <>
                                <button className="save-btn" onClick={handleSave}>
                                    Сохранить
                                </button>
                                <button className="cancel-btn" onClick={handleCancel}>
                                    Отменить
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="fields-container">
                <div className="main-content-wrapper">
                    <div className="tabs-content-wrapper">
                        <div className="tabs-container">
                            {tabsConfig.map((tab) => (
                                <button
                                    key={tab.key}
                                    className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                                    onClick={() => {
                                        setActiveTab(tab.key);
                                        setOpenDropdowns({});
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="fields-content">
                            <div className="fields-box">
                                {renderActiveTabFields()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}

export default Fields;