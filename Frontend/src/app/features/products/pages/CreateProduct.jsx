import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { MdCloudUpload } from 'react-icons/md'
import { FiPlus, FiTrash2, FiArrowLeft } from 'react-icons/fi'
import Logo from '../../auth/components/Logo'
import { useproduct } from '../hook/useproduct'
import './CreateProduct.css'

function CreateProduct() {
  const navigate = useNavigate()
  const { handlecreateproduct } = useproduct()

  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('luomi-theme') || 'light')

  // Listen for theme changes
  useEffect(() => {
    const syncTheme = () => {
      const currentTheme = localStorage.getItem('luomi-theme') || 'light'
      setTheme(currentTheme)
      document.documentElement.setAttribute('data-theme', currentTheme)
    }
    syncTheme()
    window.addEventListener('theme-changed', syncTheme)
    return () => window.removeEventListener('theme-changed', syncTheme)
  }, [])

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priceamount: '',
    pricecurrency: 'INR',
    stock: '',
    genderCategory: 'men',
    subCategory: 'shirt'
  })

  // Primary product images state
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const fileInputRef = useRef(null)

  // Dynamic Product Variants state
  const [variants, setVariants] = useState([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [successProductName, setSuccessProductName] = useState('')
  const [uploadAreaActive, setUploadAreaActive] = useState(false)

  // Handle main product input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    if (error) setError('')
  }

  // Handle primary image selection
  const handleImageSelect = (files) => {
    const fileArray = Array.from(files)
    const newImages = [...images, ...fileArray].slice(0, 7) // Max 7 images
    const newPreviews = newImages.map((file) => ({
      file,
      preview: URL.createObjectURL(file)
    }))

    setImages(newImages)
    setImagePreviews(newPreviews)

    if (error) setError('')
  }

  // Handle file input change for primary images
  const handleFileInputChange = (e) => {
    handleImageSelect(e.target.files)
  }

  // Remove primary image
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)

    if (imagePreviews[index]) {
      URL.revokeObjectURL(imagePreviews[index].preview)
    }

    setImages(newImages)
    setImagePreviews(newPreviews)
  }

  // Dynamic Variant Operations
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        stock: '0',
        priceamount: formData.priceamount || '',
        pricecurrency: 'INR',
        attributes: [{ key: 'color', value: '' }],
        images: [],
        previews: []
      }
    ])
    if (error) setError('')
  }

  const handleVariantChange = (variantIdx, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === variantIdx ? { ...v, [field]: value } : v))
    )
  }

  const removeVariant = (variantIdx) => {
    // Revoke any variant preview URLs to release memory
    variants[variantIdx].previews.forEach((url) => URL.revokeObjectURL(url))
    setVariants((prev) => prev.filter((_, i) => i !== variantIdx))
  }

  // Attribute Operations inside Variant
  const addAttribute = (variantIdx) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i === variantIdx) {
          return {
            ...v,
            attributes: [...v.attributes, { key: '', value: '' }]
          }
        }
        return v
      })
    )
  }

  const handleAttributeChange = (variantIdx, attrIdx, field, value) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i === variantIdx) {
          const updatedAttrs = v.attributes.map((attr, aIdx) =>
            aIdx === attrIdx ? { ...attr, [field]: value } : attr
          )
          return { ...v, attributes: updatedAttrs }
        }
        return v
      })
    )
  }

  const removeAttribute = (variantIdx, attrIdx) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i === variantIdx) {
          return {
            ...v,
            attributes: v.attributes.filter((_, aIdx) => aIdx !== attrIdx)
          }
        }
        return v
      })
    )
  }

  // Variant Image Operations
  const handleVariantImagesSelect = (variantIdx, files) => {
    const fileArray = Array.from(files)
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i === variantIdx) {
          const newImages = [...v.images, ...fileArray].slice(0, 5) // Max 5 images per variant
          const newPreviews = newImages.map((file) => URL.createObjectURL(file))
          return {
            ...v,
            images: newImages,
            previews: newPreviews
          }
        }
        return v
      })
    )
  }

  const removeVariantImage = (variantIdx, imgIdx) => {
    setVariants((prev) =>
      prev.map((v, i) => {
        if (i === variantIdx) {
          if (v.previews[imgIdx]) {
            URL.revokeObjectURL(v.previews[imgIdx])
          }
          const newImages = v.images.filter((_, idx) => idx !== imgIdx)
          const newPreviews = v.previews.filter((_, idx) => idx !== imgIdx)
          return {
            ...v,
            images: newImages,
            previews: newPreviews
          }
        }
        return v
      })
    )
  }

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Product title is required')
      return false
    }
    if (formData.title.trim().length < 3) {
      setError('Product title must be at least 3 characters long')
      return false
    }

    if (!formData.description.trim()) {
      setError('Product description is required')
      return false
    }
    if (formData.description.trim().length < 10) {
      setError('Product description must be at least 10 characters long')
      return false
    }

    if (!formData.priceamount || parseFloat(formData.priceamount) <= 0) {
      setError('Valid product base price is required')
      return false
    }

    if (images.length === 0) {
      setError('At least one primary product image is required')
      return false
    }

    // Validate each variant if any exist
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]
      if (!v.priceamount || parseFloat(v.priceamount) <= 0) {
        setError(`Variant #${i + 1} must have a valid price amount`)
        return false
      }
      if (v.stock === undefined || v.stock === '' || parseInt(v.stock) < 0) {
        setError(`Variant #${i + 1} must have a valid stock count`)
        return false
      }
      if (!v.attributes || v.attributes.length === 0) {
        setError(`Variant #${i + 1} must have at least one attribute defined`)
        return false
      }
      for (let j = 0; j < v.attributes.length; j++) {
        const attr = v.attributes[j]
        if (!attr.key.trim()) {
          setError(`Variant #${i + 1}, Attribute #${j + 1} must have a valid key (e.g., "Color")`)
          return false
        }
        if (!attr.value.trim()) {
          setError(`Variant #${i + 1}, Attribute #${j + 1} must have a valid value (e.g., "Black")`)
          return false
        }
      }
    }

    return true
  }

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    setLoading(true)

    try {
      // Build Multipart FormData
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title.trim())
      formDataToSend.append('description', formData.description.trim())
      formDataToSend.append('priceamount', parseFloat(formData.priceamount))
      formDataToSend.append('pricecurrency', formData.pricecurrency)
      formDataToSend.append('stock', parseInt(formData.stock) || 0)
      formDataToSend.append('genderCategory', formData.genderCategory)
      formDataToSend.append('subCategory', formData.subCategory)

      // Append all primary images
      images.forEach((file) => {
        formDataToSend.append('images', file)
      })

      // Format and append variants array
      const formattedVariants = variants.map((v) => {
        const attributesMap = {}
        v.attributes.forEach((attr) => {
          if (attr.key.trim() && attr.value.trim()) {
            attributesMap[attr.key.trim()] = attr.value.trim()
          }
        })
        return {
          stock: parseInt(v.stock) || 0,
          attributes: attributesMap,
          priceamount: parseFloat(v.priceamount) || parseFloat(formData.priceamount),
          pricecurrency: 'INR'
        }
      })

      formDataToSend.append('variants', JSON.stringify(formattedVariants))

      // Append variant specific images under unique indices
      variants.forEach((v, variantIdx) => {
        if (v.images && v.images.length > 0) {
          v.images.forEach((file) => {
            formDataToSend.append(`variant_images_${variantIdx}`, file)
          })
        }
      })

      // Call API Service
      const result = await handlecreateproduct(formDataToSend)

      if (result.success && result.product) {
        setSuccessProductName(result.product.title)
        setSuccess(`✓ "${result.product.title}" successfully published! Redirection active...`)

        // Free up Object URL resources
        imagePreviews.forEach((item) => URL.revokeObjectURL(item.preview))
        variants.forEach((v) => v.previews.forEach((url) => URL.revokeObjectURL(url)))

        // Redirection after short delay so the user sees success msg
        setTimeout(() => {
          navigate(`/product/${result.product._id}/seller`)
        }, 1500)
      } else {
        setError(result.error || 'Failed to create product. Please try again.')
      }
    } catch (err) {
      console.error('Form submission error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getCurrencySymbol = (currency) => {
    switch (currency) {
      case 'INR': return '₹'
      case 'USD': return '$'
      case 'EUR': return '€'
      case 'JPY': return '¥'
      case 'GBP': return '£'
      default: return currency
    }
  }

  return (
    <div className="createproduct-container">


      <div className="createproduct-wrapper">
        <div className="createproduct-header-section">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashbord/seller')}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-[#888888] hover:text-[#FFFFFF] transition-all cursor-pointer"
              title="Back to Dashboard"
            >
              <FiArrowLeft size={16} />
            </button>
            <div className="createproduct-logo">
              <Logo />
            </div>
          </div>
          <div className="createproduct-header-text">
            <h1 className="createproduct-title">List a New Product</h1>
            <p className="createproduct-subtitle">Fill in the details below to add your product</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="createproduct-form">
          <div className="createproduct-content">
            {/* LEFT PILLAR - Product Information */}
            <div className="createproduct-card details-card">
              <div className="card-header">
                <span className="card-step">01</span>
                <h2 className="card-title">Product Details</h2>
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label className="form-label">Product Title</label>
                  <span className="char-counter">{formData.title.length} / 200</span>
                </div>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  placeholder="e.g. Nike Air Max Atelier Series"
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={loading}
                  maxLength="200"
                />
              </div>

              <div className="form-group">
                <div className="label-row">
                  <label className="form-label">Description</label>
                  <span className="char-counter">{formData.description.length} / 2000</span>
                </div>
                <textarea
                  name="description"
                  className="form-textarea"
                  placeholder="Tell the storytelling narrative of this luxury masterpiece, highlighting its heritage, attributes, and silhouette details..."
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={loading}
                  maxLength="2000"
                />
              </div>

              <div className="price-row">
                <div className="form-group">
                  <label className="form-label">Base Price Amount</label>
                  <div className="price-input-wrapper">
                    <span className="price-symbol-addon">{getCurrencySymbol(formData.pricecurrency)}</span>
                    <input
                      type="number"
                      name="priceamount"
                      className="form-input price-input"
                      placeholder="0.00"
                      value={formData.priceamount}
                      onChange={handleInputChange}
                      disabled={loading}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <select
                    name="pricecurrency"
                    className="form-select"
                    value="INR"
                    disabled
                  >
                    <option value="INR">INR - Indian Rupee (₹)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Base Stock</label>
                  <input
                    type="number"
                    name="stock"
                    className="form-input"
                    placeholder="0"
                    value={formData.stock}
                    onChange={handleInputChange}
                    disabled={loading}
                    min="0"
                  />
                </div>
              </div>

              <div className="price-row mt-4" style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Gender Category</label>
                  <select
                    name="genderCategory"
                    className="form-select"
                    value={formData.genderCategory}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="kids">Kids</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Product Type</label>
                  <select
                    name="subCategory"
                    className="form-select"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="shirt">Shirt</option>
                    <option value="t-shirt">T-Shirt</option>
                    <option value="pants">Pants</option>
                    <option value="cargos">Cargos</option>
                    <option value="polos">Polos</option>
                    <option value="plus size">Plus Size</option>
                    <option value="trouser">Trouser</option>
                    <option value="jeans">Jeans</option>
                  </select>
                </div>
              </div>
            </div>

            {/* RIGHT PILLAR - Media & Dynamic Variants */}
            <div className="createproduct-card media-card">
              <div className="card-header">
                <span className="card-step">02</span>
                <h2 className="card-title">Media & Variants</h2>
              </div>

              {/* Primary Images Section */}
              <div className="media-section-inner">
                <label className="createproduct-images-label">Primary Product Images</label>
                
                {images.length === 0 ? (
                  <div
                    className={`image-upload-area ${uploadAreaActive ? 'active' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setUploadAreaActive(true); }}
                    onDragLeave={() => setUploadAreaActive(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setUploadAreaActive(false)
                      handleImageSelect(e.dataTransfer.files)
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="image-upload-input"
                      onChange={handleFileInputChange}
                      disabled={loading}
                    />
                    <MdCloudUpload className="upload-icon-svg" size={48} />
                    <span className="upload-text-primary">Click to upload or drag and drop</span>
                    <span className="upload-text-secondary">PNG, JPG, WEBP up to 10MB each</span>
                    <span className="upload-limit">Maximum 7 primary catalog images</span>
                  </div>
                ) : (
                  <div className="image-grid-container">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      className="image-upload-input"
                      onChange={handleFileInputChange}
                      disabled={loading || images.length >= 7}
                    />
                    <div className="image-previews-grid">
                      {imagePreviews.map((item, index) => (
                        <div key={index} className={`image-preview-item ${index === 0 ? 'cover-item' : ''}`}>
                          <img src={item.preview} alt={`Preview ${index + 1}`} />
                          {index === 0 ? (
                            <span className="cover-badge">COVER</span>
                          ) : (
                            <span className="index-badge">{index + 1}</span>
                          )}
                          <button
                            type="button"
                            className="image-preview-remove"
                            onClick={() => removeImage(index)}
                            disabled={loading}
                            title="Remove image"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      ))}
                      
                      {images.length < 7 && (
                        <div 
                          className="image-upload-tile"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FiPlus size={20} className="tile-plus-icon" />
                          <span className="tile-upload-text">Add More</span>
                          <span className="tile-upload-counter">{images.length} / 7</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Atelier Product Variants Section */}
              <div className="w-full border-t border-[rgba(255,255,255,0.06)] pt-6 flex flex-col gap-4">
                <label className="createproduct-images-label">Product Variants & Attributes</label>
                
                {variants.length > 0 && (
                  <div className="variants-container">
                    {variants.map((variant, vIdx) => (
                      <div key={vIdx} className="variant-card">
                        <div className="variant-header-row">
                          <span className="variant-card-title">Variant #{vIdx + 1}</span>
                          <button
                            type="button"
                            className="btn-remove-variant"
                            onClick={() => removeVariant(vIdx)}
                            title="Remove Variant"
                          >
                            <FiTrash2 size={12} />
                            <span>Remove</span>
                          </button>
                        </div>

                        {/* Variant Stock, Pricing, and Currency */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="form-group">
                            <label className="form-label">Stock Units</label>
                            <input
                              type="number"
                              className="form-input"
                              placeholder="e.g. 10"
                              value={variant.stock}
                              min="0"
                              onChange={(e) => handleVariantChange(vIdx, 'stock', e.target.value)}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Variant Price</label>
                            <div className="price-input-wrapper">
                              <span className="price-symbol-addon">{getCurrencySymbol(variant.pricecurrency)}</span>
                              <input
                                type="number"
                                className="form-input price-input"
                                placeholder={formData.priceamount || "0.00"}
                                value={variant.priceamount}
                                step="0.01"
                                min="0"
                                onChange={(e) => handleVariantChange(vIdx, 'priceamount', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="form-group">
                            <label className="form-label">Currency</label>
                            <select
                              className="form-select"
                              value="INR"
                              disabled
                            >
                              <option value="INR">INR (₹)</option>
                            </select>
                          </div>
                        </div>

                        {/* Variant Attributes Builder */}
                        <div className="form-group">
                          <label className="form-label">Attributes (e.g. Color, Size, Origin)</label>
                          <div className="attributes-builder">
                            {variant.attributes.map((attr, aIdx) => (
                              <div key={aIdx} className="attribute-row">
                                <input
                                  type="text"
                                  className="form-input text-xs py-2 px-3"
                                  placeholder="Key (e.g. size)"
                                  value={attr.key}
                                  onChange={(e) => handleAttributeChange(vIdx, aIdx, 'key', e.target.value)}
                                />
                                <input
                                  type="text"
                                  className="form-input text-xs py-2 px-3"
                                  placeholder="Value (e.g. M)"
                                  value={attr.value}
                                  onChange={(e) => handleAttributeChange(vIdx, aIdx, 'value', e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="text-[#FF5A5A] hover:text-[#CC0000] p-2 transition-colors cursor-pointer"
                                  onClick={() => removeAttribute(vIdx, aIdx)}
                                  title="Delete Attribute"
                                >
                                  <FiTrash2 size={12} />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              className="btn-add-attribute mt-2"
                              onClick={() => addAttribute(vIdx)}
                            >
                              <FiPlus size={11} />
                              <span>Add Attribute Row</span>
                            </button>
                          </div>
                        </div>

                        {/* Variant Specific Image Upload */}
                        <div className="variant-images-section">
                          <label className="form-label text-[10px]">Variant Images</label>
                          <div className="flex flex-wrap gap-2 items-center">
                            {variant.previews.map((url, imgIdx) => (
                              <div key={imgIdx} className="w-12 h-12 relative border border-[rgba(255,255,255,0.06)] rounded-sm overflow-hidden group">
                                <img src={url} alt="Variant" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  className="absolute inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#FF5A5A] cursor-pointer"
                                  onClick={() => removeVariantImage(vIdx, imgIdx)}
                                >
                                  <FiTrash2 size={10} />
                                </button>
                              </div>
                            ))}
                            {variant.images.length < 5 && (
                              <label className="w-12 h-12 border border-dashed border-[rgba(255,255,255,0.08)] flex items-center justify-center cursor-pointer hover:border-white transition-colors rounded-sm">
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleVariantImagesSelect(vIdx, e.target.files)}
                                />
                                <FiPlus size={14} className="text-[#888888]" />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="btn-add-variant mt-2"
                  onClick={addVariant}
                >
                  <FiPlus size={12} />
                  <span>Add Product Variant</span>
                </button>
              </div>

              {/* Submit / Action Publishing Area */}
              <div className="action-publish-block">
                <button
                  type="submit"
                  className="submit-button main-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Publishing Masterpiece...
                    </>
                  ) : (
                    'Publish Product'
                  )}
                </button>

                {error && <div className="error-message">{error}</div>}
                {success && (
                  <div className="success-message">
                    <span className="success-check">✓</span> 
                    <span className="success-product-name">"{successProductName}"</span> successfully listed! Navigating to Atelier Preview...
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProduct
