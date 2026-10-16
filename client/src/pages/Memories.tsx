
        .modal-title {
          font-family: "Poppins", sans-serif;
          font-size: 1rem;
          font-weight: 700;
        }

        .modal-body {
          color: #68736d;
          font-family: "Nunito", sans-serif;
          font-size: 0.85rem;
          line-height: 1.65;
        }

        .modal-footer .btn {
          border-radius: 999px;
          font-family: "Nunito", sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
        }

        /* =================================================
           TABLET
        ================================================= */

        @media (max-width: 991.98px) {
          .memories-header {
            padding: 28px 20px 18px;
          }

          .memories-title {
            font-size:
              clamp(
                1.65rem,
                4.5vw,
                2.25rem
              );
          }

          .memories-grid {
            row-gap: 32px !important;
          }
        }

        /* =================================================
           MOBILE
        ================================================= */

        @media (max-width: 767.98px) {
          .memories-header {
            padding:
              25px 17px 16px;
          }

          .memories-title {
            font-size: 1.9rem;
          }

          .memories-subtitle {
            margin-top: 6px;
            font-size: 0.78rem;
          }

          .memories-container {
            padding-top: 0;
            padding-left: 17px;
            padding-right: 17px;
          }

          .memories-top-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 14px;
            padding: 15px 0;
          }

          .memories-add-button {
            width: 100%;
          }

          .memories-results-bar {
            align-items: flex-start;
          }

          .memories-results-badge {
            align-self: center;
          }

          .memories-grid {
            row-gap: 28px !important;
          }

          .memory-image-wrapper,
          .memory-image-placeholder {
            height: 215px;
          }
        }

        /* =================================================
           SMALL MOBILE
        ================================================= */

        @media (max-width: 479.98px) {
          .memories-title {
            font-size: 1.8rem;
          }

          .memories-subtitle {
            font-size: 0.77rem;
          }

          .memory-card-footer {
            align-items: flex-start;
            flex-direction: column;
          }

          .memory-delete-button {
            align-self: flex-end;
          }
        }
      `}</style>
    </>
  );
};

export default Memories;
