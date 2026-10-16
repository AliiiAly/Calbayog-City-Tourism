import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Alert, Col, Row, Spinner } from "react-bootstrap";
import { ArrowLeft, Camera, Clock3, ExternalLink, Globe2, Heart, MapPin, Phone, Share2, Utensils } from "lucide-react";
import { getRestaurant, type Restaurant } from "../services/api";
import { useFavorites } from "../context/FavoritesContext";

const CALBAYOG_BLUE = "#2D3195";
const cleanString = (value: unknown): string => value == null ? "" : String(value).trim();
const normalizeImages = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string").map(v => v.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map(v => v.trim()).filter(Boolean);
  return [];
};
const websiteHref = (value: string): string => !value ? "" : (/^https?:\/\//i.test(value) ? value : `https://${value}`);

const RestaurantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { isFavorite, getFavoriteCount, setFavoriteCount, toggleFavorite } = useFavorites();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeImg, setActiveImg] = useState(0);
  const [shareNotice, setShareNotice] = useState("");

  useEffect(() => {
    let mounted = true;
    const routeId = cleanString(id);
    const load = async () => {
      setLoading(true);
      setErrorMessage("");
      if (!routeId) {
        setRestaurant(null);
        setErrorMessage("No restaurant ID was provided.");
        setLoading(false);
        return;
      }
      try {
        const response = await getRestaurant(routeId);
        const result = response?.data ?? null;
        if (!mounted) return;
        if (!result || !result.id) {
          setRestaurant(null);
          setErrorMessage("The restaurant could not be found or is no longer available.");
          return;
        }
        setRestaurant(result as Restaurant);
        setFavoriteCount("restaurant", cleanString(result.id), Math.max(0, Number((result as any).favorites) || 0));
      } catch (error) {
        console.error("Failed to load restaurant details:", error);
        if (mounted) {
          setRestaurant(null);
          setErrorMessage("Unable to load this restaurant right now. Please try again.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [id, setFavoriteCount]);

  useEffect(() => { setActiveImg(0); setShareNotice(""); }, [id]);

  const images = useMemo(() => normalizeImages(restaurant?.images), [restaurant]);
  const safeActiveImg = activeImg >= 0 && activeImg < images.length ? activeImg : 0;
  const activeImage = images[safeActiveImg] || "";
  const restaurantId = cleanString(restaurant?.id);
  const favoriteActive = restaurantId ? isFavorite("restaurant", restaurantId) : false;
  const favoriteCount = restaurantId ? getFavoriteCount("restaurant", restaurantId) : 0;
  const address = cleanString(restaurant?.location_address);
  const phone = cleanString(restaurant?.contact_phone);
  const website = cleanString(restaurant?.contact_website);
  const hours = cleanString(restaurant?.opening_hours);
  const cuisine = cleanString(restaurant?.cuisine_type);
  const priceRange = cleanString(restaurant?.price_range);
  const description = cleanString(restaurant?.description) || cleanString(restaurant?.short_description);

  const handleFavorite = async () => {
    if (restaurantId) await toggleFavorite("restaurant", restaurantId);
  };
  const handleShare = async () => {
    try {
      const data = {
        title: restaurant?.name || "Calbayog restaurant",
        text: `Check out ${restaurant?.name || "this restaurant"} in Calbayog City.`,
        url: window.location.href,
      };
      if (navigator.share) {
        await navigator.share(data);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        setShareNotice("Link copied to clipboard.");
      } else {
        setShareNotice("Copy this page link to share it.");
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") setShareNotice("Unable to share this restaurant right now.");
    }
  };

  if (loading) return <div className="restaurant-detail-state"><style>{styles}</style><div className="restaurant-state-card"><Spinner animation="border" style={{ color: CALBAYOG_BLUE }} /><h2>Loading restaurant details...</h2><p>Please wait while we load this restaurant.</p></div></div>;
  if (!restaurant) return <div className="restaurant-detail-state"><style>{styles}</style><div className="restaurant-state-card"><div className="restaurant-state-icon"><Utensils size={30} /></div><h1>Restaurant not found</h1><p>{errorMessage || "This restaurant is not available."}</p><button className="restaurant-primary-button" onClick={() => history.push("/restaurants")}><ArrowLeft size={16} /> Back to restaurants</button></div></div>;

  return (
    <div className="restaurant-detail-page">
      <style>{styles}</style>
      <main className="restaurant-detail-container">
        <button type="button" className="restaurant-back-button" onClick={() => history.push("/restaurants")}><ArrowLeft size={16} /> Back to restaurants</button>
        <Row className="restaurant-detail-layout">
          <Col lg={8}>
            <section className="restaurant-gallery" aria-label="Restaurant photos">
              {activeImage ? <img className="restaurant-main-image" src={activeImage} alt={restaurant.name} /> : <div className="restaurant-image-placeholder"><Utensils size={42} /><span>No restaurant photo available</span></div>}
              <div className="restaurant-photo-count"><Camera size={14} /> {images.length ? `${safeActiveImg + 1} / ${images.length}` : "Photos"}</div>
              {restaurant.featured && <span className="restaurant-featured-badge">Featured</span>}
            </section>
            {images.length > 1 && <div className="restaurant-thumbnails">{images.map((image, index) => <button key={`${image}-${index}`} type="button" className={`restaurant-thumbnail ${index === safeActiveImg ? "active" : ""}`} onClick={() => setActiveImg(index)} aria-label={`View photo ${index + 1}`} aria-pressed={index === safeActiveImg}><img src={image} alt="" loading="lazy" /></button>)}</div>}
            <div className="restaurant-media-actions">
              <button type="button" className="restaurant-action" onClick={() => void handleShare()} aria-label="Share restaurant"><Share2 size={19} /><span>Share</span></button>
              <button type="button" className={`restaurant-action restaurant-favorite ${favoriteActive ? "active" : ""}`} onClick={() => void handleFavorite()} aria-label={favoriteActive ? `Remove ${restaurant.name} from favorites` : `Add ${restaurant.name} to favorites`} aria-pressed={favoriteActive}><Heart size={19} fill={favoriteActive ? "currentColor" : "none"} /><span>Favorite</span><span className="restaurant-favorite-count">{favoriteCount}</span></button>
            </div>
            {shareNotice && <p className="restaurant-share-notice" role="status">{shareNotice}</p>}
            <section className="restaurant-about-card">
              <p className="restaurant-kicker">ABOUT THIS RESTAURANT</p>
              <h1>{restaurant.name}</h1>
              <div className="restaurant-tags">{cuisine && <span><Utensils size={14} /> {cuisine}</span>}{priceRange && <span>{priceRange}</span>}</div>
              <p className="restaurant-description">{description || "More information about this restaurant will be added soon."}</p>
            </section>
          </Col>
          <Col lg={4}>
            <aside className="restaurant-info-card">
              <div className="restaurant-info-heading"><div className="restaurant-heading-icon"><MapPin size={19} /></div><div><p className="restaurant-kicker">PLAN YOUR VISIT</p><h2>Restaurant information</h2></div></div>
              <div className="restaurant-divider" />
              <div className="restaurant-info-item"><div className="restaurant-info-icon"><MapPin size={18} /></div><div><span>Address</span><p>{address || "Address not available yet."}</p></div></div>
              {phone && <div className="restaurant-info-item"><div className="restaurant-info-icon"><Phone size={18} /></div><div><span>Contact number</span><p><a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>{phone}</a></p></div></div>}
              {hours && <div className="restaurant-info-item"><div className="restaurant-info-icon"><Clock3 size={18} /></div><div><span>Opening hours</span><p>{hours}</p></div></div>}
              {website && <div className="restaurant-info-item"><div className="restaurant-info-icon"><Globe2 size={18} /></div><div><span>Website</span><p><a href={websiteHref(website)} target="_blank" rel="noopener noreferrer">{website} <ExternalLink size={12} /></a></p></div></div>}
              <div className="restaurant-divider" />
              <button type="button" className="restaurant-primary-button restaurant-share-wide" onClick={() => void handleShare()}><Share2 size={16} /> Share this restaurant</button>
            </aside>
          </Col>
        </Row>
      </main>
    </div>
  );
};

const styles = `
.restaurant-detail-page,.restaurant-detail-state{min-height:100vh;background:#fff;color:#20232a;font-family:"Nunito","Poppins","Segoe UI",sans-serif;padding-bottom:64px}
.restaurant-detail-container{width:100%;max-width:1240px;margin:0 auto;padding:24px 20px 72px}
.restaurant-back-button{display:inline-flex;align-items:center;gap:7px;margin:0 0 16px;padding:5px 0;border:0;background:transparent;color:#737984;font-size:.76rem;font-weight:800;cursor:pointer}
.restaurant-back-button:hover{color:${CALBAYOG_BLUE}}
.restaurant-detail-layout{align-items:flex-start}
.restaurant-gallery{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;border-radius:20px;background:#eef1f5;box-shadow:0 10px 30px #141d3914}
.restaurant-main-image{width:100%;height:100%;display:block;object-fit:cover;object-position:center}
.restaurant-image-placeholder{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,#eef0ff,#f7f8fb);color:${CALBAYOG_BLUE};font-size:.78rem;font-weight:800}
.restaurant-photo-count{position:absolute;top:12px;right:12px;display:flex;align-items:center;gap:5px;padding:7px 10px;border-radius:999px;background:#0000007a;color:#fff;font-size:.68rem;font-weight:900}
.restaurant-featured-badge{position:absolute;top:12px;left:12px;border-radius:999px;padding:7px 10px;background:${CALBAYOG_BLUE};color:#fff;font-size:.67rem;font-weight:900}
.restaurant-thumbnails{display:flex;gap:8px;overflow-x:auto;padding:10px 0 2px;scrollbar-width:none}.restaurant-thumbnail{flex:0 0 auto;width:70px;height:50px;padding:0;overflow:hidden;border:2px solid transparent;border-radius:9px;background:#fff;opacity:.75;cursor:pointer}.restaurant-thumbnail.active{border-color:${CALBAYOG_BLUE};opacity:1}.restaurant-thumbnail img{width:100%;height:100%;object-fit:cover;display:block}
.restaurant-media-actions{display:flex;justify-content:flex-end;align-items:center;flex-wrap:wrap;gap:16px;margin:12px 2px 18px}.restaurant-action{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:4px 2px;border:0;background:transparent;color:#626a75;font-size:.72rem;font-weight:900;cursor:pointer}.restaurant-action:hover{color:${CALBAYOG_BLUE}}.restaurant-favorite.active{color:#ed4f6b}.restaurant-favorite-count{min-width:12px}.restaurant-share-notice{margin:-8px 0 16px;color:${CALBAYOG_BLUE};font-size:.78rem;font-weight:800;text-align:right}
.restaurant-about-card,.restaurant-info-card{border:1px solid #edf0f5;border-radius:18px;background:#fff;box-shadow:0 8px 28px #141d390b}.restaurant-about-card{padding:25px 26px 28px}.restaurant-kicker{margin:0 0 7px;color:${CALBAYOG_BLUE};font-size:.66rem;letter-spacing:.12em;font-weight:900}.restaurant-about-card h1{margin:0 0 14px;color:#20232a;font-size:clamp(1.65rem,3vw,2.35rem);line-height:1.18;font-weight:900;overflow-wrap:anywhere}.restaurant-tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}.restaurant-tags span{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:7px 11px;background:#eef0ff;color:${CALBAYOG_BLUE};font-size:.72rem;font-weight:900}.restaurant-description{margin:0;color:#5d6470;font-size:.94rem;line-height:1.85;white-space:pre-line;overflow-wrap:anywhere}
.restaurant-info-card{padding:23px 21px}.restaurant-info-heading{display:flex;align-items:center;gap:12px}.restaurant-heading-icon{width:42px;height:42px;display:grid;place-items:center;flex:0 0 auto;border-radius:13px;background:#eef0ff;color:${CALBAYOG_BLUE}}.restaurant-info-heading h2{margin:0;color:#20232a;font-size:1.02rem;font-weight:900}.restaurant-info-heading .restaurant-kicker{margin-bottom:4px;font-size:.59rem}.restaurant-divider{height:1px;background:#edf0f5;margin:20px 0}.restaurant-info-item{display:flex;align-items:flex-start;gap:12px;margin:18px 0}.restaurant-info-icon{width:34px;height:34px;display:grid;place-items:center;flex:0 0 auto;border-radius:11px;background:#f4f5f9;color:${CALBAYOG_BLUE}}.restaurant-info-item>div:last-child{min-width:0}.restaurant-info-item span{display:block;margin:1px 0 5px;color:#8a909b;font-size:.65rem;font-weight:900;text-transform:uppercase;letter-spacing:.055em}.restaurant-info-item p{margin:0;color:#343944;font-size:.82rem;font-weight:700;line-height:1.65;overflow-wrap:anywhere;white-space:pre-line}.restaurant-info-item a{color:${CALBAYOG_BLUE};text-decoration:none}.restaurant-info-item a:hover{text-decoration:underline}.restaurant-info-item a svg{vertical-align:middle}
.restaurant-primary-button{min-height:42px;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 16px;border:0;border-radius:11px;background:${CALBAYOG_BLUE};color:#fff;font-size:.78rem;font-weight:900;cursor:pointer}.restaurant-primary-button:hover{color:#fff;filter:brightness(1.08)}.restaurant-share-wide{width:100%}.restaurant-detail-state{display:flex;align-items:center;justify-content:center;padding:28px 20px}.restaurant-state-card{width:100%;max-width:460px;display:flex;flex-direction:column;align-items:center;text-align:center;padding:38px 28px;border:1px solid #edf0f5;border-radius:20px;background:#fff;box-shadow:0 12px 36px #141d390f}.restaurant-state-card h1,.restaurant-state-card h2{margin:18px 0 8px;color:#20232a;font-size:1.35rem;font-weight:900}.restaurant-state-card p{margin:0 0 20px;color:#727985;font-size:.88rem;line-height:1.7}.restaurant-state-icon{width:62px;height:62px;display:grid;place-items:center;border-radius:18px;background:#eef0ff;color:${CALBAYOG_BLUE}}
@media(max-width:991.98px){.restaurant-info-card{margin-top:22px}}@media(max-width:575.98px){.restaurant-detail-container{padding:18px 14px 48px}.restaurant-gallery{border-radius:15px}.restaurant-about-card{padding:20px 18px 22px}.restaurant-info-card{padding:20px 17px}.restaurant-media-actions{gap:14px}}
`;

export default RestaurantDetail;
