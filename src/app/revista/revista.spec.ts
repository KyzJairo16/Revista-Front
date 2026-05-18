import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RevistaComponent } from './revista';



describe('Revista', () => {
  let component: RevistaComponent;
  let fixture: ComponentFixture<RevistaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RevistaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RevistaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
