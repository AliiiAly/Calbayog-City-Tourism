
import React, { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

import {
  uploadMultipleImages,
  createMyMemory,
} from "../services/api";

interface MemoryFormProps {
  userId: string;
  attractionId: string;
  onSuccess?: (message: string) => void;
  onCancel?: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

interface SelectedPhoto {
  file: File;
  previewUrl: string;
}

const MemoryForm: React.FC<MemoryFormProps> = ({
  userId,
  attractionId,
  onSuccess,
  onCancel,
}) => {
  const [caption, setCaption] = useState("");
  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =====================================================
  // CLEAN UP PREVIEW URLS
  // =====================================================

  useEffect(() => {
    return () => {
      photos.forEach((photo) => {
        URL.revokeObjectURL(photo.previewUrl);
      });
    };
  }, [photos]);

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = () => {
    photos.forEach((photo) => {
      URL.revokeObjectURL(photo.previewUrl);
    });

    setCaption("");
    setPhotos([]);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // =====================================================
  // SELECT MULTIPLE PHOTOS
  // =====================================================

  const handlePhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(
      event.target.files || [],
    );

    if (selectedFiles.length === 0) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const availableSlots = MAX_IMAGES - photos.length;

    if (availableSlots <= 0) {
      setErrorMessage(
        `You can upload a maximum of ${MAX_IMAGES} pictures.`,
      );

      event.target.value = "";
      return;
    }

    const filesToProcess = selectedFiles.slice(
      0,
      availableSlots,
    );

    const invalidFile = filesToProcess.find(
      (file) =>
        !ALLOWED_IMAGE_TYPES.includes(file.type),
    );

    if (invalidFile) {
      setErrorMessage(
        "Please upload JPG, PNG, or WEBP images only.",
      );

      event.target.value = "";
      return;
    }

    const oversizedFile = filesToProcess.find(
      (file) => file.size > MAX_FILE_SIZE,
    );

    if (oversizedFile) {
      setErrorMessage(
        "Each image must be smaller than 5 MB.",
      );

      event.target.value = "";
      return;
    }

    const newPhotos: SelectedPhoto[] =
      filesToProcess.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

    setPhotos((previousPhotos) => [
      ...previousPhotos,
      ...newPhotos,
    ]);

    if (selectedFiles.length > availableSlots) {
      setErrorMessage(
        `Only ${availableSlots} more picture(s) could be added. Maximum: ${MAX_IMAGES}.`,
      );
    }

    event.target.value = "";
  };

  // =====================================================
  // REMOVE ONE PHOTO
  // =====================================================

  const handleRemovePhoto = (index: number) => {
    setPhotos((previousPhotos) => {
      const photoToRemove = previousPhotos[index];

      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
      }

      return previousPhotos.filter(
        (_, photoIndex) => photoIndex !== index,
      );
    });

    setErrorMessage("");
    setSuccessMessage("");
  };

  // =====================================================
  // SUBMIT MEMORY
  // =====================================================

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedCaption = caption.trim();

    if (!userId) {
      setErrorMessage(
        "Please log in before submitting a memory.",
      );
      return;
    }

    if (!attractionId) {
      setErrorMessage(
        "The attraction ID could not be found.",
      );
      return;
    }

    if (photos.length === 0) {
      setErrorMessage(
        "Please select at least one photo.",
      );
      return;
    }

    if (trimmedCaption.length === 0) {
      setErrorMessage(
        "Please add a caption for your memory.",
      );
      return;
    }

    if (trimmedCaption.length > 500) {
      setErrorMessage(
        "Your caption must be 500 characters or less.",
      );
      return;
    }

    try {
      setSubmitting(true);

      // =================================================
      // UPLOAD PHOTOS DIRECTLY TO SUPABASE STORAGE
      // =================================================
      //
      // This uses the existing "images" bucket through
      // uploadMultipleImages() in services/api.ts.
      //
      // The result is an array of public image URLs.
      //

      const selectedFiles = photos.map(
        (photo) => photo.file,
      );

      const uploadResponse =
        await uploadMultipleImages(selectedFiles);

      const imageUrls = uploadResponse.data.urls;

      if (
        !Array.isArray(imageUrls) ||
        imageUrls.length === 0
      ) {
        throw new Error(
          "No images were returned from Supabase Storage.",
        );
      }

      if (imageUrls.length !== selectedFiles.length) {
        throw new Error(
          "Some images could not be uploaded. Please try again.",
        );
      }

      // =================================================
      // CREATE MEMORY RECORD THROUGH THE USER API
      // =================================================
      //
      // The backend obtains user_id from the JWT.
      // Do not send user_id manually.
      //

      await createMyMemory({
        attraction_id: attractionId,
        caption: trimmedCaption,
        image_urls: imageUrls,
      });

      const message =
        "Your memory and pictures have been added successfully!";

      setSuccessMessage(message);

      resetForm();

      onSuccess?.(message);
    } catch (error: any) {
      console.error(
        "Memory submission error:",
        error,
      );

      const backendMessage =
        error?.response?.data?.message;

      const backendError =
        error?.response?.data?.error;

      setErrorMessage(
        backendMessage ||
          backendError ||
          error?.message ||
          "Something went wrong while submitting your memory.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // =====================================================
  // CANCEL FORM
  // =====================================================

  const handleCancel = () => {
    if (submitting) {
      return;
    }

    resetForm();
    onCancel?.();
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <form
      className="detail-memory-form"
      onSubmit={handleSubmit}
    >
      <div className="detail-memory-form-header">
        <h3>Share Your Memory</h3>

        <button
          type="button"
          className="detail-memory-close"
          onClick={handleCancel}
          disabled={submitting}
          aria-label="Close memory form"
        >
          <X size={15} />
        </button>
      </div>

      <div className="detail-memory-field">
        <label htmlFor="memory-photo">
          Upload Photos
        </label>

        <input
          id="memory-photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePhotoChange}
          disabled={
            submitting || photos.length >= MAX_IMAGES
          }
        />

        <small>
          JPG, PNG, or WEBP. Maximum 5 MB per image.
          <br />
          You can upload up to {MAX_IMAGES} pictures.
          <br />
          Selected: {photos.length}/{MAX_IMAGES}
        </small>
      </div>

      {photos.length > 0 && (
        <div className="detail-memory-preview-grid">
          {photos.map((photo, index) => (
            <div
              className="detail-memory-preview"
              key={photo.previewUrl}
            >
              <img
                src={photo.previewUrl}
                alt={`Selected memory photo ${
                  index + 1
                }`}
              />

              <button
                type="button"
                className="detail-memory-remove-photo"
                onClick={() =>
                  handleRemovePhoto(index)
                }
                disabled={submitting}
                aria-label={`Remove photo ${
                  index + 1
                }`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="detail-memory-field">
        <label htmlFor="memory-caption">
          Caption
        </label>

        <textarea
          id="memory-caption"
          value={caption}
          onChange={(event) =>
            setCaption(event.target.value)
          }
          placeholder="Tell us about your experience..."
          maxLength={500}
          rows={4}
          disabled={submitting}
        />

        <small>
          {caption.length}/500 characters
        </small>
      </div>

      {errorMessage && (
        <div
          className="detail-memory-error"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="detail-memory-success">
          <CheckCircle2 size={14} />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="detail-memory-form-actions">
        <button
          type="button"
          className="detail-memory-cancel"
          onClick={handleCancel}
          disabled={submitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="detail-memory-submit"
          disabled={
            submitting || photos.length === 0
          }
        >
          {submitting
            ? "Uploading pictures..."
            : "Submit Memory"}
        </button>
      </div>
    </form>
  );
};

export default MemoryForm;