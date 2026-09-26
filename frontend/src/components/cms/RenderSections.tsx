import type { ComponentType } from "react";
import type { Section } from "@shakshi/shared/cms/types";
import { Hero } from "@/components/home/Hero";
import { Anatomy } from "@/components/home/Anatomy";
import { Testimonials } from "@/components/home/Testimonials";
import { BrandComparison } from "@/components/home/BrandComparison";
import { RecommendedRow } from "@/components/commerce/RecommendedRow";
import { Certifications } from "@/components/commerce/Certifications";
import { Thread } from "@/components/about/Thread";
import * as B from "./blocks";
import { ProductGrid, ShowroomsBlock, BookingBlock, ContactBlock } from "./client-blocks";
import { fieldFn, str } from "./text";

type Block = ComponentType<B.BlockProps>;

// Client components receive `edit` (a boolean) rather than the field function: functions
// can't cross from server-rendered pages into client components.
const BLOCKS: Record<string, Block> = {
  hero: ({ d, edit }) => <Hero data={d} edit={edit} />,
  "page-header": B.PageHeader,
  "product-grid": ({ d, edit }) => <ProductGrid d={d} edit={edit} />,
  recommended: ({ d, edit }) => <RecommendedRow title={str(d.title) || undefined} fallbackTitle={str(d.fallbackTitle) || undefined} className="pt-0 lg:pt-0" edit={edit} />,
  "layers-anatomy": ({ d, edit }) => <Anatomy data={d} edit={edit} />,
  "feature-strip": B.FeatureStrip,
  comparison: ({ d, edit }) => <BrandComparison data={d} edit={edit} />,
  certifications: ({ d, f }) => (
    <section className="border-y border-ink/10 py-12" aria-label="Certifications">
      <div className="container-lux flex flex-col items-center gap-6 text-center">
        {str(d.eyebrow) && (
          <p className="eyebrow text-stone" {...f("eyebrow")}>
            {str(d.eyebrow)}
          </p>
        )}
        <Certifications className="justify-center" items={Array.isArray(d.items) ? d.items : undefined} />
      </div>
    </section>
  ),
  firmness: B.Firmness,
  "text-image": B.TextImage,
  "feature-grid": B.FeatureGrid,
  stats: B.Stats,
  testimonials: ({ d, edit }) => <Testimonials eyebrow={str(d.eyebrow)} items={Array.isArray(d.items) ? d.items : undefined} edit={edit} />,
  press: B.Press,
  "real-bedrooms": B.RealBedroomsBlock,
  tools: B.Tools,
  "library-teaser": B.LibraryTeaser,
  newsletter: B.Newsletter,
  "thread-journey": ({ d, edit }) => <Thread data={d} edit={edit} />,
  faq: B.Faq,
  "rich-text": B.RichText,
  cta: B.Cta,
  "shop-catalog": B.ShopCatalog,
  quiz: B.QuizBlock,
  configurator: B.ConfiguratorBlock,
  "sleep-calculator": B.SleepCalculatorBlock,
  swatches: B.SwatchesBlock,
  showrooms: () => <ShowroomsBlock />,
  booking: ({ d, edit }) => <BookingBlock d={d} edit={edit} />,
  contact: ({ d, edit }) => <ContactBlock d={d} edit={edit} />,
  "library-index": B.LibraryIndexBlock,
  "gift-builder": B.GiftBuilderBlock,
  "hospitality-form": B.HospitalityFormBlock,
  "setup-film": B.SetupFilmBlock,
  "expansion-timer": B.ExpansionTimerBlock,
  "society-tiers": B.SocietyTiers,
  "sleep-studio-hero": B.SleepStudioHero,
};

/**
 * Renders a page's sections in order. Works server-side for the live site and client-side
 * in the studio preview, where `edit` tags every section and field for click-to-edit.
 */
export function RenderSections({ sections, ctx, edit }: { sections: Section[]; ctx: B.BlockCtx; edit?: boolean }) {
  const f = fieldFn(edit);
  const visible = sections.filter((s) => !s.hidden && BLOCKS[s.type]);
  return (
    <>
      {visible.map((s, i) => {
        const C = BLOCKS[s.type];
        const el = <C key={s.id} d={s.data ?? {}} f={f} edit={edit} ctx={ctx} first={i === 0} />;
        // Field paths are relative to their section; the preview finds the section from this wrapper.
        return edit ? (
          <div key={s.id} data-cms-section={s.id}>
            {el}
          </div>
        ) : (
          el
        );
      })}
    </>
  );
}
