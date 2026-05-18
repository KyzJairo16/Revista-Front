import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Comentador } from './comentador';

describe('Comentador', () => {
  let component: Comentador;
  let fixture: ComponentFixture<Comentador>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Comentador],
    }).compileComponents();

    fixture = TestBed.createComponent(Comentador);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
