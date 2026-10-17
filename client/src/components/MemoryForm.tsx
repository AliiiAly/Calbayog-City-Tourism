import React, { useCallback, useEffect, useRef, useState } from "react";
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

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

interface SelectedPhoto {
  key: string;
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

  // Always holds the latest photos so previews can be released safely.
  const photosRef = useRef<SelectedPhoto[]>([]);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // =====================================================
  // CLEAN UP PREVIEW URLS (only when the form unmounts)
  // =====================================================

  useEffect(() => {
    return () => {
      photosRef.current.forEach((photo) => {
        URL.revokeObjectURL(photo.previewUrl);
      });
    };
  }, []);

  // =====================================================
  // RESET FORM
  // =====================================================

  const resetForm = useCallback(() => {
    photosRef.current.forEach((photo) => {
      URL.revokeObjectURL(photo.previewUrl);
    });

    photosRef.current = [];

    setCaption("");
    setPhotos([]);
    setErrorMessage("");
  }, []);

  // =====================================================
  // SELECT MULTIPLE PHOTOS
  //
  // Valid photos are kept. Photos with a wrong type or
  // that are too large are skipped and the user is told.
  // =====================================================

  const handlePhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(
      event.target.files || [],
    );

    // Reset so the same file can be picked again later.
    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const existingKeys = new Set(
      photosRef.current.map((photo) => photo.key),
    );

    const accepted: SelectedPhoto[] = [];

    let wrongType = 0;
    let tooLarge = 0;

    selectedFiles.forEach((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        wrongType += 1;
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        tooLarge += 1;
        return;
      }

      const key = `${file.name}-${file.size}-${file.lastModified}`;

      // Ignore the exact same photo picked twice.
      if (existingKeys.has(key)) {
        return;
      }

      existingKeys.add(key);

      accepted.push({
        key,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    });

    if (accepted.length > 0) {
      setPhotos((previousPhotos) => [
        ...previousPhotos,
        ...accepted,
      ]);
    }

    const problems: string[] = [];

    if (wrongType > 0) {
      problems.push(
        `${wrongType} ${
          wrongType === 1 ? "file was" : "files were"
        } skipped because only JPG, PNG, or WEBP images are allowed.`,
      );
    }

    if (tooLarge > 0) {
      problems.push(
        `${tooLarge} ${
          tooLarge === 1 ? "photo was" : "photos were"
        } skipped because each photo must be smaller than 5 MB.`,
      );
    }

    if (problems.length > 0) {
      setErrorMessage(problems.join(" "));
    }
  };

  // =====================================================
  // REMOVE ONE PHOTO
  // =====================================================

  const handleRemovePhoto = (key: string) => {
    setPhotos((previousPhotos) => {
      const photoToRemove = previousPhotos.find(
        (photo) => photo.key === key,
      );

      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.previewUrl);
      }

      return previousPhotos.filter(
        (photo) => photo.key !== key,
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

    if (submitting) {
      return;
    }

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

      // Upload photos to Supabase Storage through the
      // existing uploadMultipleImages() in services/api.
      // The result is an array of public image URLs.

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

      // The backend obtains user_id from the JWT.
      // Do not send user_id manually.

      await createMyMemory({
        attraction_id: attractionId,
        caption: trimmedCaption,
        image_urls: imageUrls,
      });

      const message =
        "Your memory and pictures have been added successfully!";

      resetForm();

      setSuccessMessage(message);

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
    setSuccessMessage("");
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
          disabled={submitting}
        />

        <small>
          JPG, PNG, or WEBP. Maximum 5 MB per photo.
        </small>
      </div>

      {photos.length > 0 && (
        <div className="detail-memory-preview-grid">
          {photos.map((photo, index) => (
            <div
              className="detail-memory-preview"
              key={photo.key}
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
                  handleRemovePhoto(photo.key)
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
